import { eq, desc, and, or } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import { getDatabase } from '../db';
import {
  profiles,
  playerStats,
  matches,
  headToHead,
  achievements,
  wordStats,
  periodStats,
  type Profile,
  type Match,
  type PlayerStats,
  type HeadToHead,
} from '../schema';
import type { MatchResult, GameSettings } from '../../core/game/types';
import { calculateEloChange, DEFAULT_ELO } from '../../core/elo/elo';
import { evaluateAchievements } from '../../core/achievements/achievements';

function generateId(): string {
  return Crypto.randomUUID();
}

function now(): number {
  return Date.now();
}

function getPeriodKeys(date: Date) {
  const day = date.toISOString().slice(0, 10);
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay() + 1);
  const week = weekStart.toISOString().slice(0, 10);
  const month = date.toISOString().slice(0, 7);
  return { day, week, month };
}

export async function getOrCreateProfile(name: string): Promise<Profile> {
  const db = getDatabase();
  const existing = await db.select().from(profiles).where(eq(profiles.name, name)).limit(1);

  if (existing[0]) return existing[0];

  const id = generateId();
  const timestamp = now();
  const profile = {
    id,
    name,
    elo: DEFAULT_ELO,
    accent: 'green' as const,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(profiles).values(profile);
  await db.insert(playerStats).values({
    profileId: id,
    updatedAt: timestamp,
  });

  return profile;
}

export async function getProfile(id: string): Promise<Profile | null> {
  const db = getDatabase();
  const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateProfileName(id: string, name: string): Promise<void> {
  const db = getDatabase();
  await db.update(profiles).set({ name, updatedAt: now() }).where(eq(profiles.id, id));
}

export async function getPlayerStats(profileId: string): Promise<PlayerStats | null> {
  const db = getDatabase();
  const result = await db.select().from(playerStats).where(eq(playerStats.profileId, profileId)).limit(1);
  return result[0] ?? null;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const db = getDatabase();
  return db.select().from(profiles).orderBy(desc(profiles.elo));
}

export async function getMatchHistory(limit = 50): Promise<Match[]> {
  const db = getDatabase();
  return db.select().from(matches).orderBy(desc(matches.playedAt)).limit(limit);
}

export async function getMatchById(id: string): Promise<Match | null> {
  const db = getDatabase();
  const result = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getHeadToHead(
  player1Id: string,
  player2Id: string,
): Promise<HeadToHead | null> {
  const db = getDatabase();
  const sorted = [player1Id, player2Id].sort();
  const result = await db
    .select()
    .from(headToHead)
    .where(
      and(
        eq(headToHead.player1Id, sorted[0]!),
        eq(headToHead.player2Id, sorted[1]!),
      ),
    )
    .limit(1);
  return result[0] ?? null;
}

export async function getAllHeadToHead(profileId: string): Promise<HeadToHead[]> {
  const db = getDatabase();
  return db
    .select()
    .from(headToHead)
    .where(or(eq(headToHead.player1Id, profileId), eq(headToHead.player2Id, profileId)))
    .orderBy(desc(headToHead.updatedAt));
}

export async function getUnlockedAchievements(profileId: string): Promise<string[]> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(achievements)
    .where(eq(achievements.profileId, profileId));
  return rows.map((r) => r.achievementId);
}

export interface SaveMatchInput {
  localProfileId: string;
  remoteProfileId: string;
  localPlayerName: string;
  remotePlayerName: string;
  isLocalPlayer1: boolean;
  settings: GameSettings;
  board: string[][];
  seed: number;
  result: MatchResult;
}

export interface SaveMatchOutput {
  matchId: string;
  localEloChange: number;
  newLocalElo: number;
  newAchievements: string[];
}

export async function saveMatch(input: SaveMatchInput): Promise<SaveMatchOutput> {
  const db = getDatabase();
  const timestamp = now();
  const matchId = generateId();

  const localProfile = await getProfile(input.localProfileId);
  const remoteProfile = await getOrCreateProfile(input.remotePlayerName);

  const p1Id = input.isLocalPlayer1 ? input.localProfileId : remoteProfile.id;
  const p2Id = input.isLocalPlayer1 ? remoteProfile.id : input.localProfileId;
  const p1Name = input.isLocalPlayer1 ? input.localPlayerName : input.remotePlayerName;
  const p2Name = input.isLocalPlayer1 ? input.remotePlayerName : input.localPlayerName;
  const p1Words = input.isLocalPlayer1 ? input.result.player1.rawWords : input.result.player2.rawWords;
  const p2Words = input.isLocalPlayer1 ? input.result.player2.rawWords : input.result.player1.rawWords;
  const p1Score = input.isLocalPlayer1 ? input.result.player1.score : input.result.player2.score;
  const p2Score = input.isLocalPlayer1 ? input.result.player2.score : input.result.player1.score;

  const localIsP1 = input.isLocalPlayer1;
  const localScore = localIsP1 ? p1Score : p2Score;
  const remoteScore = localIsP1 ? p2Score : p1Score;
  const localWords = localIsP1 ? p1Words : p2Words;

  const localEloBefore = localProfile?.elo ?? DEFAULT_ELO;
  const remoteEloBefore = remoteProfile.elo;

  const localResult =
    input.result.isDraw ? 'draw' : input.result.winnerId === input.localProfileId ? 'win' : 'loss';
  const remoteResult =
    input.result.isDraw ? 'draw' : input.result.winnerId === remoteProfile.id ? 'win' : 'loss';

  const localElo = calculateEloChange(localEloBefore, remoteEloBefore, localResult);
  const remoteElo = calculateEloChange(remoteEloBefore, localEloBefore, remoteResult as 'win' | 'loss' | 'draw');

  await db.insert(matches).values({
    id: matchId,
    playedAt: timestamp,
    boardSize: input.settings.boardSize,
    durationSeconds: input.settings.durationSeconds,
    language: input.settings.language,
    boardJson: JSON.stringify(input.board),
    seed: input.seed,
    player1Id: p1Id,
    player2Id: p2Id,
    player1Name: p1Name,
    player2Name: p2Name,
    winnerId: input.result.winnerId,
    isDraw: input.result.isDraw,
    player1Score: p1Score,
    player2Score: p2Score,
    player1WordsJson: JSON.stringify(p1Words),
    player2WordsJson: JSON.stringify(p2Words),
    sharedWordsJson: JSON.stringify(input.result.sharedWords),
    uniqueWordsJson: JSON.stringify(input.result.uniqueWords),
    longestWord: input.result.longestWord,
    highestScoringWord: input.result.highestScoringWord.word,
    highestScoringWordPoints: input.result.highestScoringWord.points,
    player1EloBefore: localIsP1 ? localEloBefore : remoteEloBefore,
    player2EloBefore: localIsP1 ? remoteEloBefore : localEloBefore,
    player1EloAfter: localIsP1 ? localElo.newRating : remoteElo.newRating,
    player2EloAfter: localIsP1 ? remoteElo.newRating : localElo.newRating,
  });

  await updatePlayerStats(input.localProfileId, {
    result: localResult,
    score: localScore,
    words: localWords,
    uniqueWords: input.result.uniqueWords.filter((u) => u.playerId === input.localProfileId).length,
    longestWord: localWords.reduce((l, w) => (w.length > l.length ? w : l), ''),
    winMargin: localScore - remoteScore,
  });

  await updatePlayerStats(remoteProfile.id, {
    result: remoteResult as 'win' | 'loss' | 'draw',
    score: remoteScore,
    words: localIsP1 ? p2Words : p1Words,
    uniqueWords: input.result.uniqueWords.filter((u) => u.playerId === remoteProfile.id).length,
    longestWord: (localIsP1 ? p2Words : p1Words).reduce((l, w) => (w.length > l.length ? w : l), ''),
    winMargin: remoteScore - localScore,
  });

  await db.update(profiles).set({ elo: localElo.newRating, updatedAt: timestamp }).where(eq(profiles.id, input.localProfileId));
  await db.update(profiles).set({ elo: remoteElo.newRating, updatedAt: timestamp }).where(eq(profiles.id, remoteProfile.id));

  await updateHeadToHead(p1Id, p2Id, p1Name, p2Name, p1Score, p2Score, input.result.winnerId, input.result.isDraw);
  await updatePeriodStats(input.localProfileId, localResult, localScore, localWords.length, timestamp);
  await updateWordStats(input.localProfileId, localWords, input.result.uniqueWords.filter((u) => u.playerId === input.localProfileId));

  const stats = await getPlayerStats(input.localProfileId);
  const unlocked = await getUnlockedAchievements(input.localProfileId);
  const longestWordThisMatch = localWords.reduce((l, w) => (w.length > l.length ? w : l), '').length;

  const newAchievements = evaluateAchievements({
    wins: stats?.wins ?? 0,
    totalGames: stats?.totalMatches ?? 0,
    totalWordsFound: stats?.totalWords ?? 0,
    currentWinStreak: stats?.currentWinStreak ?? 0,
    longestWordThisMatch,
    scoreThisMatch: localScore,
    uniqueWordsThisMatch: input.result.uniqueWords.filter((u) => u.playerId === input.localProfileId).length,
    alreadyUnlocked: new Set(unlocked),
  });

  for (const achievementId of newAchievements) {
    await db.insert(achievements).values({
      id: generateId(),
      profileId: input.localProfileId,
      achievementId,
      unlockedAt: timestamp,
    });
  }

  return {
    matchId,
    localEloChange: localElo.change,
    newLocalElo: localElo.newRating,
    newAchievements,
  };
}

async function updatePlayerStats(
  profileId: string,
  data: {
    result: 'win' | 'loss' | 'draw';
    score: number;
    words: string[];
    uniqueWords: number;
    longestWord: string;
    winMargin: number;
  },
) {
  const db = getDatabase();
  const stats = await getPlayerStats(profileId);
  const timestamp = now();

  const wins = (stats?.wins ?? 0) + (data.result === 'win' ? 1 : 0);
  const losses = (stats?.losses ?? 0) + (data.result === 'loss' ? 1 : 0);
  const draws = (stats?.draws ?? 0) + (data.result === 'draw' ? 1 : 0);
  const totalMatches = (stats?.totalMatches ?? 0) + 1;
  const currentWinStreak =
    data.result === 'win' ? (stats?.currentWinStreak ?? 0) + 1 : 0;
  const longestWinStreak = Math.max(stats?.longestWinStreak ?? 0, currentWinStreak);
  const biggestWin =
    data.result === 'win'
      ? Math.max(stats?.biggestWin ?? 0, data.winMargin)
      : (stats?.biggestWin ?? 0);

  await db
    .insert(playerStats)
    .values({
      profileId,
      totalMatches,
      wins,
      losses,
      draws,
      totalScore: (stats?.totalScore ?? 0) + data.score,
      totalWords: (stats?.totalWords ?? 0) + data.words.length,
      highestScore: Math.max(stats?.highestScore ?? 0, data.score),
      mostWords: Math.max(stats?.mostWords ?? 0, data.words.length),
      longestWord:
        data.longestWord.length > (stats?.longestWord?.length ?? 0)
          ? data.longestWord
          : (stats?.longestWord ?? ''),
      mostUniqueWords: Math.max(stats?.mostUniqueWords ?? 0, data.uniqueWords),
      longestWinStreak,
      currentWinStreak,
      biggestWin,
      uniqueWordsTotal: (stats?.uniqueWordsTotal ?? 0) + data.uniqueWords,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: playerStats.profileId,
      set: {
        totalMatches,
        wins,
        losses,
        draws,
        totalScore: (stats?.totalScore ?? 0) + data.score,
        totalWords: (stats?.totalWords ?? 0) + data.words.length,
        highestScore: Math.max(stats?.highestScore ?? 0, data.score),
        mostWords: Math.max(stats?.mostWords ?? 0, data.words.length),
        longestWord:
          data.longestWord.length > (stats?.longestWord?.length ?? 0)
            ? data.longestWord
            : (stats?.longestWord ?? ''),
        mostUniqueWords: Math.max(stats?.mostUniqueWords ?? 0, data.uniqueWords),
        longestWinStreak,
        currentWinStreak,
        biggestWin,
        uniqueWordsTotal: (stats?.uniqueWordsTotal ?? 0) + data.uniqueWords,
        updatedAt: timestamp,
      },
    });
}

async function updateHeadToHead(
  p1Id: string,
  p2Id: string,
  p1Name: string,
  p2Name: string,
  p1Score: number,
  p2Score: number,
  winnerId: string | null,
  isDraw: boolean,
) {
  const db = getDatabase();
  const sortedIds = [p1Id, p2Id].sort();
  const sortedNames = p1Id < p2Id ? [p1Name, p2Name] : [p2Name, p1Name];
  const existing = await getHeadToHead(sortedIds[0]!, sortedIds[1]!);
  const timestamp = now();
  const combinedScore = p1Score + p2Score;

  const p1Won = !isDraw && winnerId === sortedIds[0];
  const p2Won = !isDraw && winnerId === sortedIds[1];
  const margin = Math.abs(p1Score - p2Score);

  if (existing) {
    await db
      .update(headToHead)
      .set({
        totalMatches: existing.totalMatches + 1,
        player1Wins: existing.player1Wins + (p1Won ? 1 : 0),
        player2Wins: existing.player2Wins + (p2Won ? 1 : 0),
        draws: existing.draws + (isDraw ? 1 : 0),
        player1TotalScore: existing.player1TotalScore + (p1Id === sortedIds[0] ? p1Score : p2Score),
        player2TotalScore: existing.player2TotalScore + (p2Id === sortedIds[1] ? p2Score : p1Score),
        player1CurrentStreak: p1Won ? existing.player1CurrentStreak + 1 : 0,
        player2CurrentStreak: p2Won ? existing.player2CurrentStreak + 1 : 0,
        player1LongestStreak: p1Won
          ? Math.max(existing.player1LongestStreak, existing.player1CurrentStreak + 1)
          : existing.player1LongestStreak,
        player2LongestStreak: p2Won
          ? Math.max(existing.player2LongestStreak, existing.player2CurrentStreak + 1)
          : existing.player2LongestStreak,
        biggestWinMargin: Math.max(existing.biggestWinMargin, margin),
        highestCombinedScore: Math.max(existing.highestCombinedScore, combinedScore),
        updatedAt: timestamp,
      })
      .where(eq(headToHead.id, existing.id));
  } else {
    await db.insert(headToHead).values({
      id: generateId(),
      player1Id: sortedIds[0]!,
      player2Id: sortedIds[1]!,
      player1Name: sortedNames[0]!,
      player2Name: sortedNames[1]!,
      totalMatches: 1,
      player1Wins: p1Won ? 1 : 0,
      player2Wins: p2Won ? 1 : 0,
      draws: isDraw ? 1 : 0,
      player1TotalScore: p1Id === sortedIds[0] ? p1Score : p2Score,
      player2TotalScore: p2Id === sortedIds[1] ? p2Score : p1Score,
      player1CurrentStreak: p1Won ? 1 : 0,
      player2CurrentStreak: p2Won ? 1 : 0,
      player1LongestStreak: p1Won ? 1 : 0,
      player2LongestStreak: p2Won ? 1 : 0,
      biggestWinMargin: margin,
      highestCombinedScore: combinedScore,
      updatedAt: timestamp,
    });
  }
}

async function updatePeriodStats(
  profileId: string,
  result: 'win' | 'loss' | 'draw',
  score: number,
  wordCount: number,
  timestamp: number,
) {
  const db = getDatabase();
  const date = new Date(timestamp);
  const keys = getPeriodKeys(date);

  for (const [period, periodKey] of Object.entries(keys) as [string, string][]) {
    const id = `${profileId}-${period}-${periodKey}`;
    const existing = await db
      .select()
      .from(periodStats)
      .where(eq(periodStats.id, id))
      .limit(1);

    if (existing[0]) {
      await db
        .update(periodStats)
        .set({
          matches: existing[0].matches + 1,
          wins: existing[0].wins + (result === 'win' ? 1 : 0),
          losses: existing[0].losses + (result === 'loss' ? 1 : 0),
          draws: existing[0].draws + (result === 'draw' ? 1 : 0),
          totalScore: existing[0].totalScore + score,
          totalWords: existing[0].totalWords + wordCount,
        })
        .where(eq(periodStats.id, id));
    } else {
      await db.insert(periodStats).values({
        id,
        profileId,
        period,
        periodKey,
        matches: 1,
        wins: result === 'win' ? 1 : 0,
        losses: result === 'loss' ? 1 : 0,
        draws: result === 'draw' ? 1 : 0,
        totalScore: score,
        totalWords: wordCount,
      });
    }
  }
}

async function updateWordStats(profileId: string, words: string[], uniqueEntries: { word: string; points: number }[]) {
  const db = getDatabase();
  const uniqueMap = new Map(uniqueEntries.map((u) => [u.word.toLowerCase(), u.points]));

  for (const word of words) {
    const lower = word.toLowerCase();
    const points = uniqueMap.get(lower) ?? 0;
    const existing = await db
      .select()
      .from(wordStats)
      .where(and(eq(wordStats.profileId, profileId), eq(wordStats.word, lower)))
      .limit(1);

    if (existing[0]) {
      await db
        .update(wordStats)
        .set({
          timesFound: existing[0].timesFound + 1,
          totalPoints: existing[0].totalPoints + points,
        })
        .where(eq(wordStats.id, existing[0].id));
    } else {
      await db.insert(wordStats).values({
        id: generateId(),
        profileId,
        word: lower,
        timesFound: 1,
        totalPoints: points,
      });
    }
  }
}

export async function getPeriodStatsForProfile(
  profileId: string,
  period: 'day' | 'week' | 'month',
) {
  const db = getDatabase();
  return db
    .select()
    .from(periodStats)
    .where(and(eq(periodStats.profileId, profileId), eq(periodStats.period, period)))
    .orderBy(desc(periodStats.periodKey));
}

export async function getTopWords(profileId: string, limit = 20) {
  const db = getDatabase();
  return db
    .select()
    .from(wordStats)
    .where(eq(wordStats.profileId, profileId))
    .orderBy(desc(wordStats.timesFound))
    .limit(limit);
}
