import type { GameSettings, PlayerRole } from '../core/game/types';
import {
  ConnectionState,
  DiscoveredPeer,
  Transport,
  TransportEvents,
  createMessage,
  parseMessage,
  serializeMessage,
  MessageType,
} from './protocol';

type EventHandler = (...args: never[]) => void;

let Nearby:
  | typeof import('expo-nearby-connections')
  | null = null;

try {
  Nearby = require('expo-nearby-connections');
} catch {
  Nearby = null;
}

const SERVICE_NAME = 'BoggleDuel';

export class NearbyTransport implements Transport {
  readonly role: PlayerRole;
  readonly localPlayerId: string;
  readonly localPlayerName: string;

  state: ConnectionState = 'disconnected';
  connectedPeer: DiscoveredPeer | null = null;

  private handlers: Partial<Record<keyof TransportEvents, Set<EventHandler>>> = {};
  private peerMap = new Map<string, DiscoveredPeer>();
  private unsubscribers: (() => void)[] = [];
  private pendingSettings?: GameSettings;

  constructor(role: PlayerRole, playerId: string, playerName: string) {
    this.role = role;
    this.localPlayerId = playerId;
    this.localPlayerName = playerName;
  }

  async start(): Promise<void> {
    if (!Nearby) throw new Error('Nearby connections not available');
    this.setupListeners();
    this.setState('disconnected');
  }

  async stop(): Promise<void> {
    this.unsubscribers.forEach((u) => u());
    this.unsubscribers = [];

    if (Nearby) {
      try {
        await Nearby.stopAdvertise();
        await Nearby.stopDiscovery();
        if (this.connectedPeer) {
          await Nearby.disconnect(this.connectedPeer.id);
        }
      } catch {
        // ignore cleanup errors
      }
    }

    this.connectedPeer = null;
    this.peerMap.clear();
    this.setState('disconnected');
  }

  async advertise(settings?: GameSettings): Promise<void> {
    if (!Nearby) return;
    this.pendingSettings = settings;
    await Nearby.startAdvertise(`${SERVICE_NAME}-${this.localPlayerName}`);
    this.setState('advertising');
  }

  async discover(): Promise<void> {
    if (!Nearby) return;
    await Nearby.startDiscovery(SERVICE_NAME);
    this.setState('discovering');
  }

  async connect(peerId: string): Promise<void> {
    if (!Nearby) throw new Error('Nearby connections not available');

    this.setState('connecting');
    const peer = this.peerMap.get(peerId);
    if (!peer) throw new Error('Peer not found');

    if (this.localPlayerName.localeCompare(peer.name) <= 0) {
      await Nearby.requestConnection(peerId);
    }
  }

  async send<T>(type: MessageType, payload: T): Promise<void> {
    if (!Nearby || !this.connectedPeer) return;

    const message = serializeMessage(
      createMessage(type, payload, this.localPlayerId),
    );

    await Nearby.sendText(this.connectedPeer.id, message);
  }

  on<K extends keyof TransportEvents>(event: K, handler: TransportEvents[K]): () => void {
    if (!this.handlers[event]) {
      this.handlers[event] = new Set();
    }
    this.handlers[event]!.add(handler as EventHandler);
    return () => this.handlers[event]?.delete(handler as EventHandler);
  }

  private setupListeners() {
    if (!Nearby) return;

    this.unsubscribers.push(
      Nearby.onPeerFound((event) => {
        if (!event.name.startsWith(SERVICE_NAME)) return;

        const peer: DiscoveredPeer = {
          id: event.peerId,
          name: event.name.replace(`${SERVICE_NAME}-`, ''),
          metadata: { role: 'host' },
        };
        this.peerMap.set(event.peerId, peer);
        this.emit('onPeerFound', peer);

        if (this.role === 'guest') {
          if (this.localPlayerName.localeCompare(peer.name) > 0) {
            Nearby!.acceptConnection(event.peerId).catch(() => undefined);
          } else {
            Nearby!.requestConnection(event.peerId).catch(() => undefined);
          }
        }
      }),
    );

    this.unsubscribers.push(
      Nearby.onPeerLost((event) => {
        this.peerMap.delete(event.peerId);
        this.emit('onPeerLost', event.peerId);
      }),
    );

    this.unsubscribers.push(
      Nearby.onInvitationReceived((event) => {
        Nearby!.acceptConnection(event.peerId).catch(() => undefined);
      }),
    );

    this.unsubscribers.push(
      Nearby.onConnected((event) => {
        const peer: DiscoveredPeer = {
          id: event.peerId,
          name: event.name.replace(`${SERVICE_NAME}-`, ''),
        };
        this.connectedPeer = peer;
        this.setState('connected');
        this.emit('onConnected', peer);

        if (this.role === 'host' && this.pendingSettings) {
          this.send('lobby_settings', {
            ...this.pendingSettings,
            hostId: this.localPlayerId,
            hostName: this.localPlayerName,
          }).catch(() => undefined);
        }

        if (this.role === 'guest') {
          this.send('player_info', {
            playerId: this.localPlayerId,
            playerName: this.localPlayerName,
          }).catch(() => undefined);
        }
      }),
    );

    this.unsubscribers.push(
      Nearby.onDisconnected(() => {
        this.connectedPeer = null;
        this.setState('disconnected');
        this.emit('onDisconnected');
      }),
    );

    this.unsubscribers.push(
      Nearby.onTextReceived((event) => {
        const message = parseMessage(event.text);
        if (message) {
          this.emit('onMessage', message);
        }
      }),
    );
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

export function isNearbyAvailable(): boolean {
  return Nearby !== null;
}
