import type { RealtimeChannel } from '@supabase/supabase-js';
import type { GameSettings, PlayerRole } from '../core/game/types';
import { getSupabaseClient } from '../config/supabase';
import {
  ConnectionState,
  DiscoveredPeer,
  Transport,
  TransportEvents,
  MessageType,
  ProtocolMessage,
  createMessage,
} from './protocol';

type EventHandler = (...args: never[]) => void;

const BROADCAST_EVENT = 'msg';

/**
 * Online transport over Supabase Realtime broadcast. Two players join the same
 * channel identified by a short room code, allowing remote play over the internet
 * without any dedicated server.
 */
export class OnlineTransport implements Transport {
  readonly role: PlayerRole;
  readonly localPlayerId: string;
  readonly localPlayerName: string;
  readonly roomCode: string;

  state: ConnectionState = 'disconnected';
  connectedPeer: DiscoveredPeer | null = null;

  private handlers: Partial<Record<keyof TransportEvents, Set<EventHandler>>> = {};
  private channel: RealtimeChannel | null = null;
  private pendingSettings?: GameSettings;
  private greeted = false;
  private helloInterval: ReturnType<typeof setInterval> | null = null;

  constructor(role: PlayerRole, playerId: string, playerName: string, roomCode: string) {
    this.role = role;
    this.localPlayerId = playerId;
    this.localPlayerName = playerName;
    this.roomCode = roomCode.trim().toUpperCase();
  }

  async start(): Promise<void> {
    const client = getSupabaseClient();
    const channelName = `boggle-room-${this.roomCode}`;

    this.channel = client.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    this.channel.on('broadcast', { event: BROADCAST_EVENT }, ({ payload }) => {
      this.handleIncoming(payload as ProtocolMessage);
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Verbinding time-out')), 15000);
      this.channel!.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout);
          reject(new Error(status));
        }
      });
    });

    this.setState(this.role === 'host' ? 'advertising' : 'connecting');
  }

  async stop(): Promise<void> {
    if (this.helloInterval) {
      clearInterval(this.helloInterval);
      this.helloInterval = null;
    }
    if (this.channel) {
      try {
        await this.channel.unsubscribe();
        getSupabaseClient().removeChannel(this.channel);
      } catch {
        // ignore cleanup errors
      }
      this.channel = null;
    }
    this.connectedPeer = null;
    this.greeted = false;
    this.setState('disconnected');
  }

  async advertise(settings?: GameSettings): Promise<void> {
    this.pendingSettings = settings;
    this.setState('advertising');
    this.beginHandshake();
  }

  async discover(): Promise<void> {
    this.setState('discovering');
  }

  async connect(): Promise<void> {
    this.setState('connecting');
    this.beginHandshake();
  }

  async send<T>(type: MessageType, payload: T): Promise<void> {
    if (!this.channel) return;
    await this.channel.send({
      type: 'broadcast',
      event: BROADCAST_EVENT,
      payload: createMessage(type, payload, this.localPlayerId),
    });
  }

  on<K extends keyof TransportEvents>(event: K, handler: TransportEvents[K]): () => void {
    if (!this.handlers[event]) {
      this.handlers[event] = new Set();
    }
    this.handlers[event]!.add(handler as EventHandler);
    return () => this.handlers[event]?.delete(handler as EventHandler);
  }

  /**
   * Broadcast a hello periodically until the other player responds. This handles
   * the case where one player joins before the other has subscribed (broadcast
   * messages are not persisted).
   */
  private beginHandshake() {
    this.sendHello();
    if (this.helloInterval) clearInterval(this.helloInterval);
    this.helloInterval = setInterval(() => {
      if (this.greeted) {
        if (this.helloInterval) clearInterval(this.helloInterval);
        this.helloInterval = null;
        return;
      }
      this.sendHello();
    }, 1500);
  }

  private sendHello() {
    this.send('player_info', {
      playerId: this.localPlayerId,
      playerName: this.localPlayerName,
      role: this.role,
    });
  }

  private handleIncoming(message: ProtocolMessage) {
    if (!message || message.senderId === this.localPlayerId) return;

    if (message.type === 'player_info') {
      const info = message.payload as {
        playerId: string;
        playerName: string;
        role: PlayerRole;
      };

      const peer: DiscoveredPeer = { id: info.playerId, name: info.playerName };

      if (!this.greeted) {
        this.greeted = true;
        this.connectedPeer = peer;
        this.setState('connected');
        this.emit('onPeerFound', peer);
        this.emit('onConnected', peer);

        // Reply so the other side also completes the handshake.
        this.sendHello();

        if (this.role === 'host' && this.pendingSettings) {
          this.send('lobby_settings', {
            ...this.pendingSettings,
            hostId: this.localPlayerId,
            hostName: this.localPlayerName,
          });
        }
      }
      return;
    }

    this.emit('onMessage', message);
  }

  private setState(state: ConnectionState) {
    this.state = state;
    this.emit('onStateChange', state);
  }

  private emit<K extends keyof TransportEvents>(
    event: K,
    ...args: Parameters<TransportEvents[K]>
  ) {
    this.handlers[event]?.forEach((handler) => {
      (handler as (...a: Parameters<TransportEvents[K]>) => void)(...args);
    });
  }
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(length = 5): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}
