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

export class MockTransport implements Transport {
  readonly role: PlayerRole;
  readonly localPlayerId: string;
  readonly localPlayerName: string;

  state: ConnectionState = 'disconnected';
  connectedPeer: DiscoveredPeer | null = null;

  private handlers: Partial<Record<keyof TransportEvents, Set<EventHandler>>> = {};
  private static instances: MockTransport[] = [];
  private settings?: GameSettings;

  constructor(role: PlayerRole, playerId: string, playerName: string) {
    this.role = role;
    this.localPlayerId = playerId;
    this.localPlayerName = playerName;
    MockTransport.instances.push(this);
  }

  async start(): Promise<void> {
    this.setState('disconnected');
  }

  async stop(): Promise<void> {
    this.setState('disconnected');
    this.connectedPeer = null;
    MockTransport.instances = MockTransport.instances.filter((i) => i !== this);
  }

  async advertise(settings?: GameSettings): Promise<void> {
    this.settings = settings;
    this.setState('advertising');
  }

  async discover(): Promise<void> {
    this.setState('discovering');

    const host = MockTransport.instances.find(
      (i) => i !== this && i.role === 'host' && i.state === 'advertising',
    );

    if (host) {
      const peer: DiscoveredPeer = {
        id: host.localPlayerId,
        name: host.localPlayerName,
        metadata: host.settings
          ? {
              boardSize: String(host.settings.boardSize),
              duration: String(host.settings.durationSeconds),
            }
          : undefined,
      };
      this.emit('onPeerFound', peer);
    }
  }

  async connect(peerId: string): Promise<void> {
    const host = MockTransport.instances.find((i) => i.localPlayerId === peerId);
    if (!host) throw new Error('Peer not found');

    this.setState('connecting');

    const guestPeer: DiscoveredPeer = {
      id: this.localPlayerId,
      name: this.localPlayerName,
    };

    host.connectedPeer = guestPeer;
    host.setState('connected');
    host.emit('onConnected', guestPeer);
    host.emit('onMessage', createMessage('player_connected', {
      playerId: this.localPlayerId,
      playerName: this.localPlayerName,
    }, this.localPlayerId));

    if (host.settings) {
      this.emit('onMessage', createMessage('lobby_settings', {
        ...host.settings,
        hostId: host.localPlayerId,
        hostName: host.localPlayerName,
      }, host.localPlayerId));
    }

    this.connectedPeer = { id: host.localPlayerId, name: host.localPlayerName };
    this.setState('connected');
    this.emit('onConnected', this.connectedPeer);
  }

  async send<T>(type: MessageType, payload: T): Promise<void> {
    const message = createMessage(type, payload, this.localPlayerId);
    const peer = this.connectedPeer
      ? MockTransport.instances.find((i) => i.localPlayerId === this.connectedPeer!.id)
      : null;

    if (peer) {
      peer.emit('onMessage', message);
    }
  }

  on<K extends keyof TransportEvents>(event: K, handler: TransportEvents[K]): () => void {
    if (!this.handlers[event]) {
      this.handlers[event] = new Set();
    }
    this.handlers[event]!.add(handler as EventHandler);
    return () => this.handlers[event]?.delete(handler as EventHandler);
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

export function createMockPair(
  hostId: string,
  hostName: string,
  guestId: string,
  guestName: string,
): { host: MockTransport; guest: MockTransport } {
  return {
    host: new MockTransport('host', hostId, hostName),
    guest: new MockTransport('guest', guestId, guestName),
  };
}
