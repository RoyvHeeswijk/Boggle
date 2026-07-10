export type BoardSize = 4 | 5;
export type GameLanguage = 'nl';
export type PlayerRole = 'host' | 'guest';

export interface GameSettings {
  boardSize: BoardSize;
  durationSeconds: number;
  language: GameLanguage;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface FoundWord {
  word: string;
  path: CellPosition[];
  basePoints: number;
  finalPoints: number;
  isUnique: boolean;
  isShared: boolean;
}

export interface PlayerWords {
  playerId: string;
  playerName: string;
  words: FoundWord[];
  rawWords: string[];
}

export interface MatchResult {
  winnerId: string | null;
  isDraw: boolean;
  player1: PlayerWords & { score: number };
  player2: PlayerWords & { score: number };
  sharedWords: string[];
  uniqueWords: { playerId: string; word: string; points: number }[];
  longestWord: string;
  highestScoringWord: { word: string; points: number; playerId: string };
  totalWords: number;
  bonusPoints: number;
}

export type GamePhase =
  | 'idle'
  | 'lobby'
  | 'waiting'
  | 'countdown'
  | 'playing'
  | 'syncing'
  | 'results';

export interface GameSession {
  id: string;
  settings: GameSettings;
  board: string[][];
  seed: number;
  role: PlayerRole;
  localPlayerId: string;
  localPlayerName: string;
  remotePlayerId?: string;
  remotePlayerName?: string;
  phase: GamePhase;
  startTimestamp?: number;
  endTimestamp?: number;
}

export const PRESET_DURATIONS = [60, 120, 180, 300] as const;

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = seconds / 60;
  return mins === Math.floor(mins) ? `${mins} min` : `${mins.toFixed(1)} min`;
}
