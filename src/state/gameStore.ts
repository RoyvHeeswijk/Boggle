import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import type {
  GameSettings,
  GamePhase,
  MatchResult,
  PlayerRole,
  CellPosition,
} from '../core/game/types';
import type { Transport } from '../transport/protocol';
import { createTransport } from '../transport';
import { generateSeed, generateBoard } from '../core/board/generator';
import { generatePlayableBoard } from '../core/board/solver';
import { loadDictionary } from '../core/dictionary/dictionary';
import { computeMatchResult } from '../core/game/scoring';
import { saveMatch } from '../data/repositories/matchRepository';
import { getOrCreateProfile } from '../data/repositories/matchRepository';

interface GameStore {
  transport: Transport | null;
  role: PlayerRole | null;
  phase: GamePhase;
  settings: GameSettings;
  board: string[][] | null;
  seed: number | null;
  matchId: string | null;
  startTimestamp: number | null;
  localPlayerId: string;
  localPlayerName: string;
  remotePlayerId: string | null;
  remotePlayerName: string | null;
  foundWords: string[];
  currentPath: CellPosition[];
  currentInput: string;
  secondsRemaining: number;
  timerInterval: ReturnType<typeof setInterval> | null;
  remoteWords: string[] | null;
  matchResult: MatchResult | null;
  eloChange: number | null;
  newAchievements: string[];
  error: string | null;

  initHost: (playerName: string, playerId: string, settings: GameSettings, useMock?: boolean) => Promise<void>;
  initGuest: (playerName: string, playerId: string, useMock?: boolean) => Promise<void>;
  connectToPeer: (peerId: string) => Promise<void>;
  startGame: () => Promise<void>;
  handleMessage: (type: string, payload: unknown) => Promise<void>;
  submitWord: (word: string) => void;
  setCurrentPath: (path: CellPosition[], input: string) => void;
  clearSelection: () => void;
  tickTimer: () => void;
  endGame: () => Promise<void>;
  rematch: () => Promise<void>;
  cleanup: () => Promise<void>;
  reset: () => void;
}

const defaultSettings: GameSettings = {
  boardSize: 4,
  durationSeconds: 120,
  language: 'nl',
};

export const useGameStore = create<GameStore>((set, get) => ({
  transport: null,
  role: null,
  phase: 'idle',
  settings: defaultSettings,
  board: null,
  seed: null,
  matchId: null,
  startTimestamp: null,
  localPlayerId: '',
  localPlayerName: '',
  remotePlayerId: null,
  remotePlayerName: null,
  foundWords: [],
  currentPath: [],
  currentInput: '',
  secondsRemaining: 120,
  timerInterval: null,
  remoteWords: null,
  matchResult: null,
  eloChange: null,
  newAchievements: [],
  error: null,

  initHost: async (playerName, playerId, settings, useMock = false) => {
    const transport = createTransport('host', playerId, playerName, useMock);
    await transport.start();
    await transport.advertise(settings);

    const unsubscribers = [
      transport.on('onConnected', (peer) => {
        set({ remotePlayerId: peer.id, remotePlayerName: peer.name, phase: 'waiting' });
      }),
      transport.on('onMessage', (msg) => {
        get().handleMessage(msg.type, msg.payload);
      }),
      transport.on('onDisconnected', () => {
        set({ phase: 'lobby', remotePlayerId: null, remotePlayerName: null });
      }),
    ];

    (transport as Transport & { _unsubs?: (() => void)[] })._unsubs = unsubscribers;

    set({
      transport,
      role: 'host',
      phase: 'lobby',
      settings,
      localPlayerId: playerId,
      localPlayerName: playerName,
      secondsRemaining: settings.durationSeconds,
    });
  },

  initGuest: async (playerName, playerId, useMock = false) => {
    const transport = createTransport('guest', playerId, playerName, useMock);
    await transport.start();
    await transport.discover();

    const unsubscribers = [
      transport.on('onPeerFound', async (peer) => {
        if (peer.metadata?.role === 'host' || get().role === 'guest') {
          try {
            await transport.connect(peer.id);
          } catch {
            // connection may be initiated by other side
          }
        }
      }),
      transport.on('onConnected', (peer) => {
        set({ remotePlayerId: peer.id, remotePlayerName: peer.name, phase: 'waiting' });
      }),
      transport.on('onMessage', (msg) => {
        get().handleMessage(msg.type, msg.payload);
      }),
      transport.on('onDisconnected', () => {
        set({ error: 'Verbinding verbroken' });
      }),
    ];

    (transport as Transport & { _unsubs?: (() => void)[] })._unsubs = unsubscribers;

    set({
      transport,
      role: 'guest',
      phase: 'lobby',
      localPlayerId: playerId,
      localPlayerName: playerName,
    });
  },

  connectToPeer: async (peerId) => {
    const { transport } = get();
    if (!transport) return;
    await transport.connect(peerId);
  },

  startGame: async () => {
    const { transport, settings, role } = get();
    if (!transport || role !== 'host') return;

    const dictionary = await loadDictionary();
    const seed = generateSeed();
    const { board, seed: finalSeed } = generatePlayableBoard(
      settings.boardSize,
      seed,
      dictionary,
    );
    const matchId = Crypto.randomUUID();
    const startTimestamp = Date.now() + 4000;

    await transport.send('start_game', {
      seed: finalSeed,
      board,
      startTimestamp,
      matchId,
    });

    set({
      board,
      seed: finalSeed,
      matchId,
      startTimestamp,
      phase: 'countdown',
      foundWords: [],
      remoteWords: null,
      matchResult: null,
      secondsRemaining: settings.durationSeconds,
    });
  },

  handleMessage: async (type, payload) => {
    const state = get();

    switch (type) {
      case 'lobby_settings': {
        const p = payload as GameSettings & { hostName: string; hostId: string };
        set({
          settings: {
            boardSize: p.boardSize,
            durationSeconds: p.durationSeconds,
            language: p.language,
          },
          remotePlayerId: p.hostId,
          remotePlayerName: p.hostName,
          secondsRemaining: p.durationSeconds,
          phase: 'waiting',
        });
        break;
      }
      case 'player_connected': {
        const p = payload as { playerId: string; playerName: string };
        set({ remotePlayerId: p.playerId, remotePlayerName: p.playerName, phase: 'waiting' });
        break;
      }
      case 'start_game':
      case 'rematch': {
        const p = payload as {
          seed: number;
          board: string[][];
          startTimestamp: number;
          matchId: string;
        };
        set({
          board: p.board,
          seed: p.seed,
          matchId: p.matchId,
          startTimestamp: p.startTimestamp,
          phase: 'countdown',
          foundWords: [],
          remoteWords: null,
          matchResult: null,
          eloChange: null,
          newAchievements: [],
          secondsRemaining: state.settings.durationSeconds,
        });
        break;
      }
      case 'words_submit': {
        const p = payload as { playerId: string; words: string[] };
        if (p.playerId !== state.localPlayerId) {
          set({ remoteWords: p.words });
          if (state.phase === 'syncing') {
            await finalizeMatch(get());
          }
        }
        break;
      }
    }
  },

  submitWord: (word) => {
    const { foundWords } = get();
    if (!foundWords.includes(word)) {
      set({ foundWords: [...foundWords, word], currentPath: [], currentInput: '' });
    }
  },

  setCurrentPath: (path, input) => {
    set({ currentPath: path, currentInput: input });
  },

  clearSelection: () => {
    set({ currentPath: [], currentInput: '' });
  },

  tickTimer: () => {
    const { secondsRemaining, timerInterval, phase } = get();
    if (phase !== 'playing') return;

    if (secondsRemaining <= 1) {
      if (timerInterval) clearInterval(timerInterval);
      set({ secondsRemaining: 0, timerInterval: null });
      get().endGame();
    } else {
      set({ secondsRemaining: secondsRemaining - 1 });
    }
  },

  endGame: async () => {
    const state = get();
    if (state.phase === 'results' || state.phase === 'syncing') return;

    set({ phase: 'syncing' });

    if (state.transport) {
      await state.transport.send('words_submit', {
        playerId: state.localPlayerId,
        playerName: state.localPlayerName,
        words: state.foundWords,
      });
    }

    if (state.remoteWords) {
      await finalizeMatch(get());
    }
  },

  rematch: async () => {
    const { transport, settings, role } = get();
    if (!transport || role !== 'host') return;

    const dictionary = await loadDictionary();
    const seed = generateSeed();
    const { board, seed: finalSeed } = generatePlayableBoard(
      settings.boardSize,
      seed,
      dictionary,
    );
    const matchId = Crypto.randomUUID();
    const startTimestamp = Date.now() + 4000;

    await transport.send('rematch', {
      seed: finalSeed,
      board,
      startTimestamp,
      matchId,
    });

    set({
      board,
      seed: finalSeed,
      matchId,
      startTimestamp,
      phase: 'countdown',
      foundWords: [],
      remoteWords: null,
      matchResult: null,
      eloChange: null,
      newAchievements: [],
      secondsRemaining: settings.durationSeconds,
    });
  },

  cleanup: async () => {
    const { transport, timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval);
    if (transport) {
      const t = transport as Transport & { _unsubs?: (() => void)[] };
      t._unsubs?.forEach((u) => u());
      await transport.stop();
    }
    get().reset();
  },

  reset: () => {
    set({
      transport: null,
      role: null,
      phase: 'idle',
      settings: defaultSettings,
      board: null,
      seed: null,
      matchId: null,
      startTimestamp: null,
      remotePlayerId: null,
      remotePlayerName: null,
      foundWords: [],
      currentPath: [],
      currentInput: '',
      secondsRemaining: 120,
      timerInterval: null,
      remoteWords: null,
      matchResult: null,
      eloChange: null,
      newAchievements: [],
      error: null,
    });
  },
}));

async function finalizeMatch(state: ReturnType<typeof useGameStore.getState>) {
  if (!state.remoteWords || state.matchResult) return;

  const localWords = {
    playerId: state.localPlayerId,
    playerName: state.localPlayerName,
    words: [],
    rawWords: state.foundWords,
  };

  const remoteWords = {
    playerId: state.remotePlayerId ?? 'remote',
    playerName: state.remotePlayerName ?? 'Tegenstander',
    words: [],
    rawWords: state.remoteWords,
  };

  const result = computeMatchResult(localWords, remoteWords);

  let eloChange = 0;
  let newAchievements: string[] = [];

  try {
    const profile = await getOrCreateProfile(state.localPlayerName);
    const saveResult = await saveMatch({
      localProfileId: profile.id,
      remoteProfileId: state.remotePlayerId ?? 'remote',
      localPlayerName: state.localPlayerName,
      remotePlayerName: state.remotePlayerName ?? 'Tegenstander',
      isLocalPlayer1: state.role === 'host',
      settings: state.settings,
      board: state.board ?? [],
      seed: state.seed ?? 0,
      result,
    });
    eloChange = saveResult.localEloChange;
    newAchievements = saveResult.newAchievements;
  } catch (e) {
    console.warn('Failed to save match:', e);
  }

  useGameStore.setState({
    matchResult: result,
    phase: 'results',
    eloChange,
    newAchievements,
  });
}

export function startGameTimer() {
  const store = useGameStore.getState();
  if (store.timerInterval) clearInterval(store.timerInterval);

  const interval = setInterval(() => {
    useGameStore.getState().tickTimer();
  }, 1000);

  useGameStore.setState({ timerInterval: interval, phase: 'playing' });
}

export function beginCountdown(onComplete: () => void) {
  const { startTimestamp } = useGameStore.getState();
  const delay = startTimestamp ? Math.max(0, startTimestamp - Date.now()) : 4000;

  setTimeout(() => {
    onComplete();
    startGameTimer();
  }, delay);
}
