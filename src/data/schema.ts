import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  elo: integer('elo').notNull().default(1200),
  accent: text('accent').notNull().default('green'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const playerStats = sqliteTable('player_stats', {
  profileId: text('profile_id').primaryKey().references(() => profiles.id),
  totalMatches: integer('total_matches').notNull().default(0),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  draws: integer('draws').notNull().default(0),
  totalScore: integer('total_score').notNull().default(0),
  totalWords: integer('total_words').notNull().default(0),
  highestScore: integer('highest_score').notNull().default(0),
  mostWords: integer('most_words').notNull().default(0),
  longestWord: text('longest_word').notNull().default(''),
  highestScoringWord: text('highest_scoring_word').notNull().default(''),
  highestScoringWordPoints: integer('highest_scoring_word_points').notNull().default(0),
  mostUniqueWords: integer('most_unique_words').notNull().default(0),
  longestWinStreak: integer('longest_win_streak').notNull().default(0),
  currentWinStreak: integer('current_win_streak').notNull().default(0),
  biggestWin: integer('biggest_win').notNull().default(0),
  uniqueWordsTotal: integer('unique_words_total').notNull().default(0),
  updatedAt: integer('updated_at').notNull(),
});

export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  playedAt: integer('played_at').notNull(),
  boardSize: integer('board_size').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  language: text('language').notNull().default('nl'),
  boardJson: text('board_json').notNull(),
  seed: integer('seed').notNull(),
  player1Id: text('player1_id').notNull(),
  player2Id: text('player2_id').notNull(),
  player1Name: text('player1_name').notNull(),
  player2Name: text('player2_name').notNull(),
  winnerId: text('winner_id'),
  isDraw: integer('is_draw', { mode: 'boolean' }).notNull().default(false),
  player1Score: integer('player1_score').notNull(),
  player2Score: integer('player2_score').notNull(),
  player1WordsJson: text('player1_words_json').notNull(),
  player2WordsJson: text('player2_words_json').notNull(),
  sharedWordsJson: text('shared_words_json').notNull(),
  uniqueWordsJson: text('unique_words_json').notNull(),
  longestWord: text('longest_word').notNull().default(''),
  highestScoringWord: text('highest_scoring_word').notNull().default(''),
  highestScoringWordPoints: integer('highest_scoring_word_points').notNull().default(0),
  player1EloBefore: integer('player1_elo_before'),
  player2EloBefore: integer('player2_elo_before'),
  player1EloAfter: integer('player1_elo_after'),
  player2EloAfter: integer('player2_elo_after'),
});

export const headToHead = sqliteTable('head_to_head', {
  id: text('id').primaryKey(),
  player1Id: text('player1_id').notNull(),
  player2Id: text('player2_id').notNull(),
  player1Name: text('player1_name').notNull(),
  player2Name: text('player2_name').notNull(),
  totalMatches: integer('total_matches').notNull().default(0),
  player1Wins: integer('player1_wins').notNull().default(0),
  player2Wins: integer('player2_wins').notNull().default(0),
  draws: integer('draws').notNull().default(0),
  player1TotalScore: integer('player1_total_score').notNull().default(0),
  player2TotalScore: integer('player2_total_score').notNull().default(0),
  player1CurrentStreak: integer('player1_current_streak').notNull().default(0),
  player2CurrentStreak: integer('player2_current_streak').notNull().default(0),
  player1LongestStreak: integer('player1_longest_streak').notNull().default(0),
  player2LongestStreak: integer('player2_longest_streak').notNull().default(0),
  biggestWinMargin: integer('biggest_win_margin').notNull().default(0),
  highestCombinedScore: integer('highest_combined_score').notNull().default(0),
  updatedAt: integer('updated_at').notNull(),
});

export const achievements = sqliteTable('achievements', {
  id: text('id').primaryKey(),
  profileId: text('profile_id').notNull().references(() => profiles.id),
  achievementId: text('achievement_id').notNull(),
  unlockedAt: integer('unlocked_at').notNull(),
});

export const wordStats = sqliteTable('word_stats', {
  id: text('id').primaryKey(),
  profileId: text('profile_id').notNull().references(() => profiles.id),
  word: text('word').notNull(),
  timesFound: integer('times_found').notNull().default(1),
  totalPoints: integer('total_points').notNull().default(0),
});

export const periodStats = sqliteTable('period_stats', {
  id: text('id').primaryKey(),
  profileId: text('profile_id').notNull().references(() => profiles.id),
  period: text('period').notNull(),
  periodKey: text('period_key').notNull(),
  matches: integer('matches').notNull().default(0),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  draws: integer('draws').notNull().default(0),
  totalScore: integer('total_score').notNull().default(0),
  totalWords: integer('total_words').notNull().default(0),
});

export type Profile = typeof profiles.$inferSelect;
export type PlayerStats = typeof playerStats.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type HeadToHead = typeof headToHead.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type WordStat = typeof wordStats.$inferSelect;
export type PeriodStat = typeof periodStats.$inferSelect;
