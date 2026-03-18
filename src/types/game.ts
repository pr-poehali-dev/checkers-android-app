export type Screen = "menu" | "game" | "game2p" | "settings" | "rating" | "stats" | "rules";
export type PieceColor = "white" | "black";
export type Difficulty = "beginner" | "easy" | "medium" | "hard" | "master";

export interface Piece {
  id: number;
  color: PieceColor;
  isKing: boolean;
  row: number;
  col: number;
}

export interface Move {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  captured?: { row: number; col: number };
}

export interface GameStats {
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  bestWinStreak: number;
  currentStreak: number;
}

export interface Settings {
  difficulty: Difficulty;
  playerColor: PieceColor;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  showHints: boolean;
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Новичок",
  easy: "Легкий",
  medium: "Средний",
  hard: "Сложный",
  master: "Мастер",
};

export const DIFFICULTY_DEPTH: Record<Difficulty, number> = {
  beginner: 1,
  easy: 2,
  medium: 3,
  hard: 4,
  master: 6,
};

export const RATING_DATA = [
  { name: "Гроссмейстер_99", score: 2850, wins: 342, difficulty: "Мастер", avatar: "🏆" },
  { name: "ШашечныйКороль", score: 2640, wins: 287, difficulty: "Мастер", avatar: "👑" },
  { name: "Стратег", score: 2410, wins: 231, difficulty: "Сложный", avatar: "⚡" },
  { name: "ЧёрныйФерзь", score: 2280, wins: 198, difficulty: "Сложный", avatar: "🔥" },
  { name: "АтакующийСтиль", score: 2100, wins: 167, difficulty: "Средний", avatar: "🎯" },
  { name: "Тактик64", score: 1950, wins: 143, difficulty: "Средний", avatar: "🛡" },
  { name: "НовыйЧемпион", score: 1820, wins: 112, difficulty: "Легкий", avatar: "🌟" },
  { name: "Игрок777", score: 1650, wins: 89, difficulty: "Легкий", avatar: "💎" },
];

export const DEF_SETTINGS: Settings = {
  difficulty: "medium",
  playerColor: "white",
  soundEnabled: true,
  animationsEnabled: true,
  showHints: true,
};

export const DEF_STATS: GameStats = {
  wins: 0,
  losses: 0,
  draws: 0,
  gamesPlayed: 0,
  bestWinStreak: 0,
  currentStreak: 0,
};