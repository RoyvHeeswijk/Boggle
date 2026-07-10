import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type {
  Profile,
  PlayerStats,
  Match,
  HeadToHead,
  PeriodStat,
  WordStat,
} from '../schema';
import type { MatchResult, GameSettings } from '../../core/game/types';
import { calculateEloChange, DEFAULT_ELO } from '../../core/elo/elo';
import { evaluateAchievements } from '../../core/achievements/achievements';
import { detectNewRecords, type NewRecord } from '../../core/game/records';

const STORAGE_KEY = 'boggle-duel-web-data';

interface WebStore {
  profiles: Profile[];
  playerStats: PlayerStats[];
  matches: Match[];
  headToHead: HeadToHead[];
  achievements: { id: string; profileId: string; achievementId: string; unlockedAt: number }[];
  wordStats: WordStat[];
  periodStats: PeriodStat[];
}

const emptyStore = (): WebStore => ({
  profiles: [],
  playerStats: [],
  matches: [],
  headToHead: [],
  achievements: [],
  wordStats: [],
  periodStats: [],
});

async function loadStore(): Promise<WebStore> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyStore();
  try {
    return JSON.parse(raw) as WebStore;
  } catch {
    return emptyStore();
  }
}

async function saveStore(store: WebStore): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

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
  const store = await loadStore();
  const existing = store.profiles.find((p) => p.name === name);
  if (existing) return existing;

  const id = generateId();
  const timestamp = now();
  const profile: Profile = {
    id,
    name,
    elo: DEFAULT_ELO,
    accent: 'green',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.profiles.push(profile);
  store.playerStats.push({
    profileId: id,
    totalMatches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalScore: 0,
    totalWords: 0,
    highestScore: 0,
    mostWords: 0,
    longestWord: '',
    highestScoringWord: '',
    highestScoringWordPoints: 0,
    mostUniqueWords: 0,
    longestWinStreak: 0,
    currentWinStreak: 0,
    biggestWin: 0,
    uniqueWordsTotal: 0,
    updatedAt: timestamp,
  });

  await saveStore(store);
  return profile;
}

export async function getProfile(id: string): Promise<Profile | null> {
  const store = await loadStore();
  return store.profiles.find((p) => p.id === id) ?? null;
}

export async function updateProfileName(id: string, name: string): Promise<void> {
  const store = await loadStore();
  const profile = store.profiles.find((p) => p.id === id);
  if (profile) {
    profile.name = name;
    profile.updatedAt = now();
    await saveStore(store);
  }
}

export async function getPlayerStats(profileId: string): Promise<PlayerStats | null> {
  const store = await loadStore();
  return store.playerStats.find((s) => s.profileId === profileId) ?? null;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const store = await loadStore();
  return [...store.profiles].sort((a, b) => b.elo - a.elo);
}

export async function getMatchHistory(limit = 50): Promise<Match[]> {
  const store = await loadStore();
  return [...store.matches].sort((a, b) => b.playedAt - a.playedAt).slice(0, limit);
}

export async function getMatchById(id: string): Promise<Match | null> {
  const store = await loadStore();
  return store.matches.find((m) => m.id === id) ?? null;
}

export async function getHeadToHead(
  player1Id: string,
  player2Id: string,
): Promise<HeadToHead | null> {
  const store = await loadStore();
  const sorted = [player1Id, player2Id].sort();
  return (
    store.headToHead.find(
      (h) => h.player1Id === sorted[0] && h.player2Id === sorted[1],
    ) ?? null
  );
}

export async function getAllHeadToHead(profileId: string): Promise<HeadToHead[]> {
  const store = await loadStore();
  return store.headToHead
    .filter((h) => h.player1Id === profileId || h.player2Id === profileId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getUnlockedAchievements(profileId: string): Promise<string[]> {
  const store = await loadStore();
  return store.achievements
    .filter((a) => a.profileId === profileId)
    .map((a) => a.achievementId);
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
  newRecords: NewRecord[];
}

export async function saveMatch(input: SaveMatchInput): Promise<SaveMatchOutput> {
  const store = await loadStore();
  const timestamp = now();
  const matchId = generateId();

  const localProfile = store.profiles.find((p) => p.id === input.localProfileId);
  let remoteProfile = store.profiles.find((p) => p.name === input.remotePlayerName);
  if (!remoteProfile) {
    remoteProfile = await getOrCreateProfile(input.remotePlayerName);
  }

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

  const statsBefore = store.playerStats.find((s) => s.profileId === input.localProfileId);
  const recordStatsBefore = {
    totalMatches: statsBefore?.totalMatches ?? 0,
    highestScore: statsBefore?.highestScore ?? 0,
    mostWords: statsBefore?.mostWords ?? 0,
    longestWordLength: statsBefore?.longestWord?.length ?? 0,
    biggestWin: statsBefore?.biggestWin ?? 0,
  };

  store.matches.push({
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

  await updatePlayerStatsInStore(store, input.localProfileId, {
    result: localResult,
    score: localScore,
    words: localWords,
    uniqueWords: input.result.uniqueWords.filter((u) => u.playerId === input.localProfileId).length,
    longestWord: localWords.reduce((l, w) => (w.length > l.length ? w : l), ''),
    winMargin: localScore - remoteScore,
  });

  await updatePlayerStatsInStore(store, remoteProfile.id, {
    result: remoteResult as 'win' | 'loss' | 'draw',
    score: remoteScore,
    words: localIsP1 ? p2Words : p1Words,
    uniqueWords: input.result.uniqueWords.filter((u) => u.playerId === remoteProfile!.id).length,
    longestWord: (localIsP1 ? p2Words : p1Words).reduce((l, w) => (w.length > l.length ? w : l), ''),
    winMargin: remoteScore - localScore,
  });

  const localP = store.profiles.find((p) => p.id === input.localProfileId);
  const remoteP = store.profiles.find((p) => p.id === remoteProfile.id);
  if (localP) localP.elo = localElo.newRating;
  if (remoteP) remoteP.elo = remoteElo.newRating;

  updateHeadToHeadInStore(store, p1Id, p2Id, p1Name, p2Name, p1Score, p2Score, input.result.winnerId, input.result.isDraw);
  updatePeriodStatsInStore(store, input.localProfileId, localResult, localScore, localWords.length, timestamp);

  const stats = store.playerStats.find((s) => s.profileId === input.localProfileId);
  const unlocked = store.achievements.filter((a) => a.profileId === input.localProfileId).map((a) => a.achievementId);
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
    store.achievements.push({
      id: generateId(),
      profileId: input.localProfileId,
      achievementId,
      unlockedAt: timestamp,
    });
  }

  await saveStore(store);

  const newRecords = detectNewRecords(recordStatsBefore, {
    score: localScore,
    wordCount: localWords.length,
    longestWord: localWords.reduce((l, w) => (w.length > l.length ? w : l), ''),
    won: localResult === 'win',
    winMargin: localScore - remoteScore,
  });

  return {
    matchId,
    localEloChange: localElo.change,
    newLocalElo: localElo.newRating,
    newAchievements,
    newRecords,
  };
}

async function updatePlayerStatsInStore(
  store: WebStore,
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
  let stats = store.playerStats.find((s) => s.profileId === profileId);
  if (!stats) {
    stats = {
      profileId,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      totalScore: 0,
      totalWords: 0,
      highestScore: 0,
      mostWords: 0,
      longestWord: '',
      highestScoringWord: '',
      highestScoringWordPoints: 0,
      mostUniqueWords: 0,
      longestWinStreak: 0,
      currentWinStreak: 0,
      biggestWin: 0,
      uniqueWordsTotal: 0,
      updatedAt: now(),
    };
    store.playerStats.push(stats);
  }

  stats.totalMatches += 1;
  if (data.result === 'win') stats.wins += 1;
  if (data.result === 'loss') stats.losses += 1;
  if (data.result === 'draw') stats.draws += 1;
  stats.totalScore += data.score;
  stats.totalWords += data.words.length;
  stats.highestScore = Math.max(stats.highestScore, data.score);
  stats.mostWords = Math.max(stats.mostWords, data.words.length);
  if (data.longestWord.length > stats.longestWord.length) stats.longestWord = data.longestWord;
  stats.mostUniqueWords = Math.max(stats.mostUniqueWords, data.uniqueWords);
  stats.currentWinStreak = data.result === 'win' ? stats.currentWinStreak + 1 : 0;
  stats.longestWinStreak = Math.max(stats.longestWinStreak, stats.currentWinStreak);
  if (data.result === 'win') stats.biggestWin = Math.max(stats.biggestWin, data.winMargin);
  stats.uniqueWordsTotal += data.uniqueWords;
  stats.updatedAt = now();
}

function updateHeadToHeadInStore(
  store: WebStore,
  p1Id: string,
  p2Id: string,
  p1Name: string,
  p2Name: string,
  p1Score: number,
  p2Score: number,
  winnerId: string | null,
  isDraw: boolean,
) {
  const sortedIds = [p1Id, p2Id].sort();
  const sortedNames = p1Id < p2Id ? [p1Name, p2Name] : [p2Name, p1Name];
  let h2h = store.headToHead.find(
    (h) => h.player1Id === sortedIds[0] && h.player2Id === sortedIds[1],
  );

  const p1Won = !isDraw && winnerId === sortedIds[0];
  const p2Won = !isDraw && winnerId === sortedIds[1];
  const margin = Math.abs(p1Score - p2Score);
  const combinedScore = p1Score + p2Score;

  if (h2h) {
    h2h.totalMatches += 1;
    if (p1Won) h2h.player1Wins += 1;
    if (p2Won) h2h.player2Wins += 1;
    if (isDraw) h2h.draws += 1;
    h2h.player1TotalScore += p1Id === sortedIds[0] ? p1Score : p2Score;
    h2h.player2TotalScore += p2Id === sortedIds[1] ? p2Score : p1Score;
    h2h.player1CurrentStreak = p1Won ? h2h.player1CurrentStreak + 1 : 0;
    h2h.player2CurrentStreak = p2Won ? h2h.player2CurrentStreak + 1 : 0;
    h2h.player1LongestStreak = p1Won
      ? Math.max(h2h.player1LongestStreak, h2h.player1CurrentStreak)
      : h2h.player1LongestStreak;
    h2h.player2LongestStreak = p2Won
      ? Math.max(h2h.player2LongestStreak, h2h.player2CurrentStreak)
      : h2h.player2LongestStreak;
    h2h.biggestWinMargin = Math.max(h2h.biggestWinMargin, margin);
    h2h.highestCombinedScore = Math.max(h2h.highestCombinedScore, combinedScore);
    h2h.updatedAt = now();
  } else {
    store.headToHead.push({
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
      updatedAt: now(),
    });
  }
}

function updatePeriodStatsInStore(
  store: WebStore,
  profileId: string,
  result: 'win' | 'loss' | 'draw',
  score: number,
  wordCount: number,
  timestamp: number,
) {
  const keys = getPeriodKeys(new Date(timestamp));
  for (const [period, periodKey] of Object.entries(keys)) {
    const id = `${profileId}-${period}-${periodKey}`;
    let ps = store.periodStats.find((p) => p.id === id);
    if (ps) {
      ps.matches += 1;
      if (result === 'win') ps.wins += 1;
      if (result === 'loss') ps.losses += 1;
      if (result === 'draw') ps.draws += 1;
      ps.totalScore += score;
      ps.totalWords += wordCount;
    } else {
      store.periodStats.push({
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

export async function getPeriodStatsForProfile(
  profileId: string,
  period: 'day' | 'week' | 'month',
) {
  const store = await loadStore();
  return store.periodStats
    .filter((p) => p.profileId === profileId && p.period === period)
    .sort((a, b) => b.periodKey.localeCompare(a.periodKey));
}

export async function getTopWords(profileId: string, limit = 20) {
  const store = await loadStore();
  return store.wordStats
    .filter((w) => w.profileId === profileId)
    .sort((a, b) => b.timesFound - a.timesFound)
    .slice(0, limit);
}

export async function initWebStorage(): Promise<void> {
  await loadStore();
}
