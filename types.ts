
export enum Suit {
  Spades = '♠',
  Hearts = '♥',
  Diamonds = '♦',
  Clubs = '♣',
}

export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export const RANK_VALUES: Record<Rank, number> = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
};

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  isFaceUp: boolean;
}

export type Tableau = Card[][];

export interface GameState {
  tableau: Tableau;
  stock: Card[];
  foundations: number; // Number of completed King-to-Ace sets
  moves: number;
  score: number;
}

export type Difficulty = 1 | 2 | 4; // Number of suits
