/**
 * Personal record detection. Pure and UI-agnostic: given a player's stats
 * before a match and their performance in it, determine which all-time
 * personal records were broken.
 */

export type RecordId = 'highest_score' | 'most_words' | 'longest_word' | 'biggest_win';

export interface RecordDefinition {
  id: RecordId;
  title: string;
  icon: string;
}

export const RECORD_DEFINITIONS: Record<RecordId, RecordDefinition> = {
  highest_score: { id: 'highest_score', title: 'Hoogste score ooit', icon: '💯' },
  most_words: { id: 'most_words', title: 'Meeste woorden ooit', icon: '📚' },
  longest_word: { id: 'longest_word', title: 'Langste woord ooit', icon: '📏' },
  biggest_win: { id: 'biggest_win', title: 'Grootste overwinning', icon: '🚀' },
};

export interface NewRecord {
  id: RecordId;
  title: string;
  icon: string;
  value: string;
}

export interface RecordStatsBefore {
  totalMatches: number;
  highestScore: number;
  mostWords: number;
  longestWordLength: number;
  biggestWin: number;
}

export interface MatchPerformance {
  score: number;
  wordCount: number;
  longestWord: string;
  won: boolean;
  winMargin: number;
}

/**
 * Only flags records when the player has prior history (totalMatches >= 1),
 * so the very first game doesn't trivially report everything as a record.
 */
export function detectNewRecords(
  before: RecordStatsBefore,
  perf: MatchPerformance,
): NewRecord[] {
  if (before.totalMatches < 1) return [];

  const records: NewRecord[] = [];

  const push = (id: RecordId, value: string) => {
    const def = RECORD_DEFINITIONS[id];
    records.push({ id, title: def.title, icon: def.icon, value });
  };

  if (perf.score > before.highestScore) {
    push('highest_score', `${perf.score} punten`);
  }
  if (perf.wordCount > before.mostWords) {
    push('most_words', `${perf.wordCount} woorden`);
  }
  if (perf.longestWord.length > before.longestWordLength) {
    push('longest_word', perf.longestWord.toUpperCase());
  }
  if (perf.won && perf.winMargin > before.biggestWin) {
    push('biggest_win', `+${perf.winMargin} verschil`);
  }

  return records;
}
