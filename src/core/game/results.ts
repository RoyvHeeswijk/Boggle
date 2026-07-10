/**
 * Pure results logic for a Boggle match. This module is UI-agnostic: it only
 * compares word lists and computes points/winner. The results screen consumes
 * the view-model builders here so presentation and logic stay fully separated.
 *
 * Scoring: 3 letters = 1, 4 = 2, ... each extra letter +1 (i.e. length - 2).
 * Duplicate words (found by both players) score 0.
 * Unique words score double their base points.
 */

export function calculateWordPoints(word: string): number {
  const len = word.length;
  if (len < 3) return 0;
  return len - 2;
}

export interface WordComparison {
  unique1: string[];
  unique2: string[];
  duplicates: string[];
}

const norm = (w: string) => w.trim().toLowerCase();

/** Compare two word lists using Sets/Maps for O(n) lookups. */
export function compareWordLists(words1: string[], words2: string[]): WordComparison {
  const map1 = new Map<string, string>();
  const map2 = new Map<string, string>();
  for (const w of words1) map1.set(norm(w), w);
  for (const w of words2) map2.set(norm(w), w);

  const unique1: string[] = [];
  const unique2: string[] = [];
  const duplicates: string[] = [];

  for (const [key, original] of map1) {
    if (map2.has(key)) duplicates.push(original);
    else unique1.push(original);
  }
  for (const [key, original] of map2) {
    if (!map1.has(key)) unique2.push(original);
  }

  return { unique1, unique2, duplicates };
}

/** Words in `own` that the `opponent` did not find (de-duplicated). */
export function getUniqueWords(own: string[], opponent: string[]): string[] {
  const opp = new Set(opponent.map(norm));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of own) {
    const k = norm(w);
    if (!opp.has(k) && !seen.has(k)) {
      seen.add(k);
      out.push(w);
    }
  }
  return out;
}

/** Words present in both lists (de-duplicated, taken from list `a`). */
export function getDuplicateWords(a: string[], b: string[]): string[] {
  const bs = new Set(b.map(norm));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of a) {
    const k = norm(w);
    if (bs.has(k) && !seen.has(k)) {
      seen.add(k);
      out.push(w);
    }
  }
  return out;
}

/** Total score for a player given their unique words (each doubled). */
export function calculateScore(uniqueWords: string[]): number {
  return uniqueWords.reduce((sum, w) => sum + calculateWordPoints(w) * 2, 0);
}

export interface WinnerOutcome {
  winner: 1 | 2 | null;
  isDraw: boolean;
}

export function determineWinner(score1: number, score2: number): WinnerOutcome {
  if (score1 === score2) return { winner: null, isDraw: true };
  return { winner: score1 > score2 ? 1 : 2, isDraw: false };
}

// ---------------------------------------------------------------------------
// View-model builders (still pure) consumed by the results UI.
// ---------------------------------------------------------------------------

export type WordStatus = 'unique' | 'duplicate';

export interface WordRow {
  word: string;
  points: number;
  status: WordStatus;
}

/** Build display rows for one player's words, unique first then duplicates. */
export function buildWordRows(ownWords: string[], opponentWords: string[]): WordRow[] {
  const duplicates = new Set(getDuplicateWords(ownWords, opponentWords).map(norm));
  const seen = new Set<string>();
  const rows: WordRow[] = [];

  for (const w of ownWords) {
    const k = norm(w);
    if (seen.has(k)) continue;
    seen.add(k);
    const status: WordStatus = duplicates.has(k) ? 'duplicate' : 'unique';
    const points = status === 'unique' ? calculateWordPoints(w) * 2 : 0;
    rows.push({ word: w, points, status });
  }

  return rows.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'unique' ? -1 : 1;
    if (b.points !== a.points) return b.points - a.points;
    return a.word.localeCompare(b.word);
  });
}

export interface PlayerSummary {
  score: number;
  totalWords: number;
  uniqueWords: number;
  duplicateWords: number;
  longestWord: string;
  highestScoringWord: { word: string; points: number };
}

/** Compact per-player summary for the summary card. */
export function buildPlayerSummary(ownWords: string[], opponentWords: string[]): PlayerSummary {
  const rows = buildWordRows(ownWords, opponentWords);
  const unique = rows.filter((r) => r.status === 'unique');
  const duplicates = rows.filter((r) => r.status === 'duplicate');

  const longestWord = rows.reduce((l, r) => (r.word.length > l.length ? r.word : l), '');
  const highest = unique.reduce(
    (best, r) => (r.points > best.points ? { word: r.word, points: r.points } : best),
    { word: '', points: 0 },
  );

  return {
    score: unique.reduce((s, r) => s + r.points, 0),
    totalWords: rows.length,
    uniqueWords: unique.length,
    duplicateWords: duplicates.length,
    longestWord,
    highestScoringWord: highest,
  };
}
