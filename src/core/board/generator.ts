import { getDiceSet, rollDie } from './dice';
import type { BoardSize } from '../game/types';

export interface SeededRng {
  next: () => number;
  seed: number;
}

export function createRng(seed: number): SeededRng {
  let state = seed >>> 0;
  return {
    seed,
    next() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    },
  };
}

export function generateSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

export function generateBoard(size: BoardSize, seed: number): string[][] {
  const rng = createRng(seed);
  const dice = getDiceSet(size).map((faces) => [...faces]);

  // Fisher-Yates shuffle
  for (let i = dice.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [dice[i], dice[j]] = [dice[j]!, dice[i]!];
  }

  const board: string[][] = [];
  for (let row = 0; row < size; row++) {
    const rowLetters: string[] = [];
    for (let col = 0; col < size; col++) {
      const die = dice[row * size + col]!;
      rowLetters.push(rollDie(die, () => rng.next()));
    }
    board.push(rowLetters);
  }

  return board;
}

export function boardToFlat(board: string[][]): string[] {
  return board.flat();
}

export function flatToBoard(flat: string[], size: BoardSize): string[][] {
  const board: string[][] = [];
  for (let i = 0; i < size; i++) {
    board.push(flat.slice(i * size, (i + 1) * size));
  }
  return board;
}
