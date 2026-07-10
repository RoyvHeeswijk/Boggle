import type { BoardSize, CellPosition } from '../game/types';
import type { Dictionary } from '../dictionary/dictionary';
import { generateBoard } from './generator';

const DIRECTIONS: CellPosition[] = [
  { row: -1, col: -1 },
  { row: -1, col: 0 },
  { row: -1, col: 1 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
];

export function getAdjacent(pos: CellPosition): CellPosition[] {
  return DIRECTIONS.map((d) => ({ row: pos.row + d.row, col: pos.col + d.col }));
}

export function isValidCell(pos: CellPosition, size: BoardSize): boolean {
  return pos.row >= 0 && pos.row < size && pos.col >= 0 && pos.col < size;
}

export function posKey(pos: CellPosition): string {
  return `${pos.row},${pos.col}`;
}

export function findWordPath(
  board: string[][],
  word: string,
  dictionary: Dictionary,
): CellPosition[] | null {
  const size = board.length as BoardSize;
  const normalized = word.toUpperCase();

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const path = search(board, size, normalized, dictionary, row, col, 0, new Set());
      if (path) return path;
    }
  }
  return null;
}

function search(
  board: string[][],
  size: BoardSize,
  word: string,
  dictionary: Dictionary,
  row: number,
  col: number,
  index: number,
  visited: Set<string>,
): CellPosition[] | null {
  if (board[row]![col] !== word[index]) return null;

  const key = posKey({ row, col });
  if (visited.has(key)) return null;

  const newVisited = new Set(visited);
  newVisited.add(key);
  const currentPath: CellPosition[] = [{ row, col }];

  if (index === word.length - 1) return currentPath;

  const prefix = word.slice(0, index + 1);
  if (!dictionary.hasPrefix(prefix)) return null;

  for (const dir of DIRECTIONS) {
    const nr = row + dir.row;
    const nc = col + dir.col;
    if (!isValidCell({ row: nr, col: nc }, size)) continue;
    if (newVisited.has(posKey({ row: nr, col: nc }))) continue;

    const subPath = search(board, size, word, dictionary, nr, nc, index + 1, newVisited);
    if (subPath) return [...currentPath, ...subPath];
  }

  return null;
}

export function solveBoard(
  board: string[][],
  dictionary: Dictionary,
  minLength = 3,
): string[] {
  const size = board.length as BoardSize;
  const found = new Set<string>();

  function dfs(
    row: number,
    col: number,
    prefix: string,
    visited: Set<string>,
  ) {
    const letter = board[row]![col]!;
    const word = prefix + letter;
    const key = posKey({ row, col });

    if (visited.has(key)) return;

    if (!dictionary.hasPrefix(word)) return;

    if (word.length >= minLength && dictionary.has(word)) {
      found.add(word);
    }

    const newVisited = new Set(visited);
    newVisited.add(key);

    for (const dir of DIRECTIONS) {
      const nr = row + dir.row;
      const nc = col + dir.col;
      if (!isValidCell({ row: nr, col: nc }, size)) continue;
      dfs(nr, nc, word, newVisited);
    }
  }

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      dfs(row, col, '', new Set());
    }
  }

  return Array.from(found).sort();
}

export function validateBoardPlayability(
  board: string[][],
  dictionary: Dictionary,
  minWords = 40,
  minThreeLetter = 20,
): boolean {
  const words = solveBoard(board, dictionary);
  const threeLetter = words.filter((w) => w.length === 3).length;
  return words.length >= minWords && threeLetter >= minThreeLetter;
}

export function generatePlayableBoard(
  size: BoardSize,
  seed: number,
  dictionary: Dictionary,
  maxAttempts = 50,
): { board: string[][]; seed: number; wordCount: number } {
  let currentSeed = seed;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const board = generateBoard(size, currentSeed);

    if (validateBoardPlayability(board, dictionary)) {
      const words = solveBoard(board, dictionary);
      return { board, seed: currentSeed, wordCount: words.length };
    }

    currentSeed = (currentSeed * 1103515245 + 12345) >>> 0;
  }

  const board = generateBoard(size, seed);
  const words = solveBoard(board, dictionary);
  return { board, seed, wordCount: words.length };
}
