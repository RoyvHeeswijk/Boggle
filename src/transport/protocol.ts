import type { GameSettings, PlayerRole } from '../core/game/types';

export type MessageType =
  | 'lobby_settings'
  | 'player_info'
  | 'player_connected'
  | 'start_game'
  | 'words_submit'
  | 'rematch'
  | 'return_lobby'
  | 'disconnect'
  | 'ping'
  | 'pong';

export interface ProtocolMessage<T = unknown> {
  type: MessageType;
  payload: T;
  timestamp: number;
  senderId: string;
}

export interface PlayerInfoPayload {
  playerId: string;
  playerName: string;
}

export interface LobbySettingsPayload extends GameSettings {
  hostId: string;
  hostName: string;
}

export interface StartGamePayload {
  seed: number;
  board: string[][];
  startTimestamp: number;
  matchId: string;
}

export interface WordsSubmitPayload {
  playerId: string;
  playerName: string;
  words: string[];
}

export interface RematchPayload {
  seed: number;
  board: string[][];
  startTimestamp: number;
  matchId: string;
}

export type ConnectionState =
  | 'disconnected'
  | 'advertising'
  | 'discovering'
  | 'connecting'
  | 'connected';

export interface DiscoveredPeer {
  id: string;
  name: string;
  metadata?: Record<string, string>;
}

export interface TransportEvents {
  onStateChange: (state: ConnectionState) => void;
  onPeerFound: (peer: DiscoveredPeer) => void;
  onPeerLost: (peerId: string) => void;
  onConnected: (peer: DiscoveredPeer) => void;
  onDisconnected: () => void;
  onMessage: (message: ProtocolMessage) => void;
  onError: (error: Error) => void;
}

export interface Transport {
  readonly role: PlayerRole;
  readonly state: ConnectionState;
  readonly localPlayerId: string;
  readonly localPlayerName: string;
  readonly connectedPeer: DiscoveredPeer | null;

  start(): Promise<void>;
  stop(): Promise<void>;
  advertise(settings?: GameSettings): Promise<void>;
  discover(): Promise<void>;
  connect(peerId: string): Promise<void>;
  send<T>(type: MessageType, payload: T): Promise<void>;
  on<K extends keyof TransportEvents>(event: K, handler: TransportEvents[K]): () => void;
}

export function createMessage<T>(
  type: MessageType,
  payload: T,
  senderId: string,
): ProtocolMessage<T> {
  return {
    type,
    payload,
    timestamp: Date.now(),
    senderId,
  };
}

export function serializeMessage(message: ProtocolMessage): string {
  return JSON.stringify(message);
}

export function parseMessage(data: string): ProtocolMessage | null {
  try {
    const parsed = JSON.parse(data) as ProtocolMessage;
    if (!parsed.type || !parsed.senderId) return null;
    return parsed;
  } catch {
    return null;
  }
}
