export const DEFAULT_ELO = 1200;
export const K_FACTOR = 32;

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function calculateEloChange(
  playerRating: number,
  opponentRating: number,
  result: 'win' | 'loss' | 'draw',
): { newRating: number; change: number } {
  const expected = expectedScore(playerRating, opponentRating);
  const actual = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
  const change = Math.round(K_FACTOR * (actual - expected));
  return {
    newRating: Math.max(100, playerRating + change),
    change,
  };
}

export function getEloTier(rating: number): string {
  if (rating >= 2000) return 'Grandmaster';
  if (rating >= 1800) return 'Master';
  if (rating >= 1600) return 'Expert';
  if (rating >= 1400) return 'Advanced';
  if (rating >= 1200) return 'Intermediate';
  return 'Beginner';
}
