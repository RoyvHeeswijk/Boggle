/** Nederlandse Boggle-dobbelstenen gebaseerd op letterfrequentie */

export const DICE_4X4: string[][] = [
  ['A', 'A', 'E', 'E', 'I', 'O'],
  ['A', 'E', 'E', 'N', 'R', 'T'],
  ['A', 'D', 'E', 'N', 'R', 'S'],
  ['B', 'C', 'H', 'K', 'L', 'M'],
  ['D', 'E', 'G', 'H', 'L', 'N'],
  ['E', 'E', 'I', 'N', 'S', 'T'],
  ['E', 'G', 'H', 'I', 'N', 'R'],
  ['E', 'I', 'L', 'R', 'S', 'T'],
  ['E', 'N', 'O', 'R', 'S', 'T'],
  ['G', 'H', 'I', 'J', 'K', 'L'],
  ['I', 'J', 'K', 'L', 'M', 'N'],
  ['O', 'O', 'P', 'R', 'S', 'T'],
  ['O', 'P', 'R', 'S', 'T', 'U'],
  ['A', 'E', 'I', 'O', 'U', 'Y'],
  ['D', 'F', 'G', 'P', 'V', 'W'],
  ['B', 'C', 'F', 'M', 'P', 'Z'],
];

export const DICE_5X5: string[][] = [
  ...DICE_4X4,
  ['A', 'E', 'I', 'O', 'U', 'W'],
  ['D', 'E', 'I', 'L', 'R', 'T'],
  ['E', 'E', 'G', 'H', 'N', 'R'],
  ['E', 'I', 'L', 'M', 'N', 'S'],
  ['F', 'G', 'H', 'J', 'K', 'V'],
  ['G', 'H', 'I', 'K', 'L', 'M'],
  ['I', 'J', 'K', 'L', 'N', 'O'],
  ['O', 'P', 'Q', 'R', 'S', 'T'],
  ['P', 'R', 'S', 'T', 'U', 'V'],
  ['W', 'X', 'Y', 'Z', 'A', 'E'],
];

export function getDiceSet(size: 4 | 5): string[][] {
  return size === 4 ? DICE_4X4 : DICE_5X5;
}

export function rollDie(faces: string[], rng: () => number): string {
  const index = Math.floor(rng() * faces.length);
  return faces[index]!;
}
