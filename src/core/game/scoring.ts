import type { FoundWord, MatchResult, PlayerWords } from './types';
import { calculateWordPoints } from './results';

export function basePointsForWord(word: string): number {
  return calculateWordPoints(word);
}

export function computeMatchResult(
  player1: PlayerWords,
  player2: PlayerWords,
): MatchResult {
  const p1Words = new Map(player1.rawWords.map((w) => [w.toLowerCase(), w]));
  const p2Words = new Map(player2.rawWords.map((w) => [w.toLowerCase(), w]));

  const sharedWords: string[] = [];
  const uniqueWords: { playerId: string; word: string; points: number }[] = [];

  const processPlayer = (
    player: PlayerWords,
    opponentWords: Map<string, string>,
  ): { words: FoundWord[]; score: number } => {
    let score = 0;
    const words: FoundWord[] = player.rawWords.map((raw) => {
      const lower = raw.toLowerCase();
      const base = basePointsForWord(raw);
      const isShared = opponentWords.has(lower);
      const isUnique = !isShared;
      const finalPoints = isShared ? 0 : base * 2;

      if (isShared) {
        if (!sharedWords.includes(raw)) sharedWords.push(raw);
      } else {
        uniqueWords.push({ playerId: player.playerId, word: raw, points: finalPoints });
      }

      score += finalPoints;

      return {
        word: raw,
        path: [],
        basePoints: base,
        finalPoints,
        isUnique,
        isShared,
      };
    });

    return { words, score };
  };

  const p1Result = processPlayer(player1, p2Words);
  const p2Result = processPlayer(player2, p1Words);

  const allWords = [...player1.rawWords, ...player2.rawWords];
  const longestWord = allWords.reduce(
    (longest, w) => (w.length > longest.length ? w : longest),
    '',
  );

  let highestScoringWord = { word: '', points: 0, playerId: '' };
  for (const entry of uniqueWords) {
    if (entry.points > highestScoringWord.points) {
      highestScoringWord = entry;
    }
  }

  const p1Score = p1Result.score;
  const p2Score = p2Result.score;
  const isDraw = p1Score === p2Score;
  const winnerId = isDraw
    ? null
    : p1Score > p2Score
      ? player1.playerId
      : player2.playerId;

  const bonusPoints = uniqueWords.reduce((sum, u) => sum + u.points, 0) / 2;

  return {
    winnerId,
    isDraw,
    player1: { ...player1, words: p1Result.words, score: p1Score },
    player2: { ...player2, words: p2Result.words, score: p2Score },
    sharedWords: sharedWords.sort(),
    uniqueWords,
    longestWord,
    highestScoringWord,
    totalWords: player1.rawWords.length + player2.rawWords.length,
    bonusPoints,
  };
}

export function liveScore(words: string[]): number {
  return words.reduce((sum, w) => sum + basePointsForWord(w), 0);
}
