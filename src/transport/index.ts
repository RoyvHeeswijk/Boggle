import type { PlayerRole } from '../core/game/types';
import { MockTransport } from './MockTransport';
import { NearbyTransport, isNearbyAvailable } from './NearbyTransport';
import { OnlineTransport, generateRoomCode } from './OnlineTransport';
import { isOnlineAvailable } from '../config/supabase';
import type { Transport } from './protocol';

export type TransportMode = 'online' | 'local' | 'mock';

export interface CreateTransportOptions {
  mode?: TransportMode;
  roomCode?: string;
}

export function createTransport(
  role: PlayerRole,
  playerId: string,
  playerName: string,
  options: CreateTransportOptions = {},
): Transport {
  const { mode = 'online', roomCode } = options;

  if (mode === 'mock') {
    return new MockTransport(role, playerId, playerName);
  }

  if (mode === 'local' && isNearbyAvailable()) {
    return new NearbyTransport(role, playerId, playerName);
  }

  if (mode === 'online' && isOnlineAvailable() && roomCode) {
    return new OnlineTransport(role, playerId, playerName, roomCode);
  }

  // Fallbacks: prefer local peer-to-peer on device, otherwise mock.
  if (isNearbyAvailable()) {
    return new NearbyTransport(role, playerId, playerName);
  }
  return new MockTransport(role, playerId, playerName);
}

export {
  MockTransport,
  NearbyTransport,
  OnlineTransport,
  isNearbyAvailable,
  isOnlineAvailable,
  generateRoomCode,
};
