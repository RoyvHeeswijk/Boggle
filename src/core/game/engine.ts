import type { Dictionary } from '../dictionary/dictionary';
import { normalizeWord } from '../dictionary/trie';
import { findWordPath } from '../board/solver';
import { basePointsForWord, liveScore } from './scoring';
import type { CellPosition, FoundWord } from './types';

export type WordValidationResult =
  | { valid: true; word: string; path: CellPosition[]; points: number }
  | { valid: false; reason: 'too_short' | 'not_in_dictionary' | 'not_on_board' | 'already_found' | 'invalid' };

export function validateWordInput(
  rawInput: string,
  board: string[][],
  dictionary: Dictionary,
  foundWords: string[],
): WordValidationResult {
  const normalized = normalizeWord(rawInput);
  if (!normalized) {
    return rawInput.trim().length < 3
      ? { valid: false, reason: 'too_short' }
      : { valid: false, reason: 'invalid' };
  }

  if (foundWords.some((w) => w.toLowerCase() === normalized)) {
    return { valid: false, reason: 'already_found' };
  }

  if (!dictionary.has(normalized)) {
    return { valid: false, reason: 'not_in_dictionary' };
  }

  const upper = normalized.toUpperCase();
  const path = findWordPath(board, upper, dictionary);
  if (!path) {
    return { valid: false, reason: 'not_on_board' };
  }

  return {
    valid: true,
    word: upper,
    path,
    points: basePointsForWord(normalized),
  };
}

export function createFoundWord(
  word: string,
  path: CellPosition[],
): FoundWord {
  return {
    word,
    path,
    basePoints: basePointsForWord(word),
    finalPoints: basePointsForWord(word),
    isUnique: false,
    isShared: false,
  };
}

export { liveScore, basePointsForWord };
