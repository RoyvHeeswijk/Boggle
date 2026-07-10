import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDatabase() {
  if (!dbInstance) {
    const expo = openDatabaseSync('boggle-duel.db');
    dbInstance = drizzle(expo, { schema });
    initializeTables(expo);
  }
  return dbInstance;
}

function initializeTables(expo: ReturnType<typeof openDatabaseSync>) {
  expo.execSync(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      elo INTEGER NOT NULL DEFAULT 1200,
      accent TEXT NOT NULL DEFAULT 'green',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS player_stats (
      profile_id TEXT PRIMARY KEY NOT NULL,
      total_matches INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      draws INTEGER NOT NULL DEFAULT 0,
      total_score INTEGER NOT NULL DEFAULT 0,
      total_words INTEGER NOT NULL DEFAULT 0,
      highest_score INTEGER NOT NULL DEFAULT 0,
      most_words INTEGER NOT NULL DEFAULT 0,
      longest_word TEXT NOT NULL DEFAULT '',
      highest_scoring_word TEXT NOT NULL DEFAULT '',
      highest_scoring_word_points INTEGER NOT NULL DEFAULT 0,
      most_unique_words INTEGER NOT NULL DEFAULT 0,
      longest_win_streak INTEGER NOT NULL DEFAULT 0,
      current_win_streak INTEGER NOT NULL DEFAULT 0,
      biggest_win INTEGER NOT NULL DEFAULT 0,
      unique_words_total INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY NOT NULL,
      played_at INTEGER NOT NULL,
      board_size INTEGER NOT NULL,
      duration_seconds INTEGER NOT NULL,
      language TEXT NOT NULL DEFAULT 'nl',
      board_json TEXT NOT NULL,
      seed INTEGER NOT NULL,
      player1_id TEXT NOT NULL,
      player2_id TEXT NOT NULL,
      player1_name TEXT NOT NULL,
      player2_name TEXT NOT NULL,
      winner_id TEXT,
      is_draw INTEGER NOT NULL DEFAULT 0,
      player1_score INTEGER NOT NULL,
      player2_score INTEGER NOT NULL,
      player1_words_json TEXT NOT NULL,
      player2_words_json TEXT NOT NULL,
      shared_words_json TEXT NOT NULL,
      unique_words_json TEXT NOT NULL,
      longest_word TEXT NOT NULL DEFAULT '',
      highest_scoring_word TEXT NOT NULL DEFAULT '',
      highest_scoring_word_points INTEGER NOT NULL DEFAULT 0,
      player1_elo_before INTEGER,
      player2_elo_before INTEGER,
      player1_elo_after INTEGER,
      player2_elo_after INTEGER
    );

    CREATE TABLE IF NOT EXISTS head_to_head (
      id TEXT PRIMARY KEY NOT NULL,
      player1_id TEXT NOT NULL,
      player2_id TEXT NOT NULL,
      player1_name TEXT NOT NULL,
      player2_name TEXT NOT NULL,
      total_matches INTEGER NOT NULL DEFAULT 0,
      player1_wins INTEGER NOT NULL DEFAULT 0,
      player2_wins INTEGER NOT NULL DEFAULT 0,
      draws INTEGER NOT NULL DEFAULT 0,
      player1_total_score INTEGER NOT NULL DEFAULT 0,
      player2_total_score INTEGER NOT NULL DEFAULT 0,
      player1_current_streak INTEGER NOT NULL DEFAULT 0,
      player2_current_streak INTEGER NOT NULL DEFAULT 0,
      player1_longest_streak INTEGER NOT NULL DEFAULT 0,
      player2_longest_streak INTEGER NOT NULL DEFAULT 0,
      biggest_win_margin INTEGER NOT NULL DEFAULT 0,
      highest_combined_score INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at INTEGER NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS word_stats (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL,
      word TEXT NOT NULL,
      times_found INTEGER NOT NULL DEFAULT 1,
      total_points INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS period_stats (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL,
      period TEXT NOT NULL,
      period_key TEXT NOT NULL,
      matches INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      draws INTEGER NOT NULL DEFAULT 0,
      total_score INTEGER NOT NULL DEFAULT 0,
      total_words INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (profile_id) REFERENCES profiles(id)
    );
  `);
}

export { schema };
