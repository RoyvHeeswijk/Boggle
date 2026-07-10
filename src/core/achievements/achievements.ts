export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'wins' | 'words' | 'scores' | 'streaks' | 'games' | 'special';
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first_win', title: 'Eerste overwinning', description: 'Win je eerste wedstrijd', icon: '🏆', category: 'wins' },
  { id: 'wins_10', title: 'Tien overwinningen', description: 'Win 10 wedstrijden', icon: '🥇', category: 'wins' },
  { id: 'wins_50', title: 'Vijftig overwinningen', description: 'Win 50 wedstrijden', icon: '👑', category: 'wins' },
  { id: 'wins_100', title: 'Honderd overwinningen', description: 'Win 100 wedstrijden', icon: '💎', category: 'wins' },
  { id: 'word_8', title: 'Acht letters', description: 'Vind je eerste woord van 8 letters', icon: '📝', category: 'words' },
  { id: 'word_10', title: 'Tien letters', description: 'Vind je eerste woord van 10 letters', icon: '📚', category: 'words' },
  { id: 'score_100', title: 'Honderd punten', description: 'Scoor meer dan 100 punten in een wedstrijd', icon: '💯', category: 'scores' },
  { id: 'unique_25', title: '25 unieke woorden', description: 'Vind 25 unieke woorden in een wedstrijd', icon: '✨', category: 'scores' },
  { id: 'unique_50', title: '50 unieke woorden', description: 'Vind 50 unieke woorden in een wedstrijd', icon: '🌟', category: 'scores' },
  { id: 'streak_5', title: 'Winreeks 5', description: 'Win 5 keer achter elkaar', icon: '🔥', category: 'streaks' },
  { id: 'streak_10', title: 'Winreeks 10', description: 'Win 10 keer achter elkaar', icon: '⚡', category: 'streaks' },
  { id: 'words_1000', title: 'Duizend woorden', description: 'Vind in totaal 1000 woorden', icon: '📖', category: 'words' },
  { id: 'words_5000', title: 'Vijfduizend woorden', description: 'Vind in totaal 5000 woorden', icon: '📕', category: 'words' },
  { id: 'games_100', title: 'Honderd wedstrijden', description: 'Speel 100 wedstrijden', icon: '🎮', category: 'games' },
  { id: 'games_500', title: 'Vijfhonderd wedstrijden', description: 'Speel 500 wedstrijden', icon: '🎯', category: 'games' },
];

export interface AchievementContext {
  wins: number;
  totalGames: number;
  totalWordsFound: number;
  currentWinStreak: number;
  longestWordThisMatch: number;
  scoreThisMatch: number;
  uniqueWordsThisMatch: number;
  alreadyUnlocked: Set<string>;
}

export function evaluateAchievements(ctx: AchievementContext): string[] {
  const newlyUnlocked: string[] = [];

  const check = (id: string, condition: boolean) => {
    if (condition && !ctx.alreadyUnlocked.has(id)) {
      newlyUnlocked.push(id);
    }
  };

  check('first_win', ctx.wins >= 1);
  check('wins_10', ctx.wins >= 10);
  check('wins_50', ctx.wins >= 50);
  check('wins_100', ctx.wins >= 100);
  check('word_8', ctx.longestWordThisMatch >= 8);
  check('word_10', ctx.longestWordThisMatch >= 10);
  check('score_100', ctx.scoreThisMatch > 100);
  check('unique_25', ctx.uniqueWordsThisMatch >= 25);
  check('unique_50', ctx.uniqueWordsThisMatch >= 50);
  check('streak_5', ctx.currentWinStreak >= 5);
  check('streak_10', ctx.currentWinStreak >= 10);
  check('words_1000', ctx.totalWordsFound >= 1000);
  check('words_5000', ctx.totalWordsFound >= 5000);
  check('games_100', ctx.totalGames >= 100);
  check('games_500', ctx.totalGames >= 500);

  return newlyUnlocked;
}

export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
