export type GameModeId = 'classic' | 'time-attack' | 'fever';

export interface GameModeConfig {
  id: GameModeId;
  name: string;
  description: string;
  isAvailable: boolean;
  clawSpeed: number;
  guestCatchChance: number;
  normalCatchChance: number;
  pityCatchChance: number;
  pityThreshold: number;
}

export const GAME_MODES: Record<GameModeId, GameModeConfig> = {
  classic: {
    id: 'classic',
    name: 'Classic Arcade',
    description: 'Mode mesin capit klasik dengan sistem pity 10x.',
    isAvailable: true,
    clawSpeed: 1.65,
    guestCatchChance: 30,
    normalCatchChance: 10,
    pityCatchChance: 90,
    pityThreshold: 10,
  },
  'time-attack': {
    id: 'time-attack',
    name: 'Time Attack (Segera)',
    description: 'Mode cepat dengan batas waktu — akan datang.',
    isAvailable: false,
    clawSpeed: 2.2,
    guestCatchChance: 30,
    normalCatchChance: 15,
    pityCatchChance: 90,
    pityThreshold: 8,
  },
  fever: {
    id: 'fever',
    name: 'Fever Mode (Segera)',
    description: 'Mode spesial dengan peluang bonus — akan datang.',
    isAvailable: false,
    clawSpeed: 1.85,
    guestCatchChance: 35,
    normalCatchChance: 20,
    pityCatchChance: 95,
    pityThreshold: 6,
  },
};
