import type { PlayerRole } from '../core/game/types';
import { MockTransport } from './MockTransport';
import { NearbyTransport, isNearbyAvailable } from './NearbyTransport';
import type { Transport } from './protocol';

export function createTransport(
  role: PlayerRole,
  playerId: string,
  playerName: string,
  forceMock = false,
): Transport {
  if (!forceMock && isNearbyAvailable()) {
    return new NearbyTransport(role, playerId, playerName);
  }
  return new MockTransport(role, playerId, playerName);
}

export { MockTransport, NearbyTransport, isNearbyAvailable };
