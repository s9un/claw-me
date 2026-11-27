export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface PrizeTemplate {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  description: string;
  points: number;
}

export interface CapsuleEntity {
  uid: string;
  prize: PrizeTemplate;
  position: [number, number, number];
  shellColor: string;
  accentColor: string;
}

export interface CollectedPrize extends PrizeTemplate {
  uid: string;
  collectedAt: number;
}

export const RARITY_CONFIG: Record<
  Rarity,
  {
    label: string;
    color: string;
    glow: string;
    badgeBg: string;
    shellColors: string[];
    weight: number;
  }
> = {
  common: {
    label: 'Common',
    color: '#60a5fa',
    glow: 'rgba(96, 165, 250, 0.45)',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    shellColors: ['#38bdf8', '#fb7185', '#4ade80', '#facc15'],
    weight: 50,
  },
  rare: {
    label: 'Rare',
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.55)',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    shellColors: ['#a855f7', '#ec4899', '#2dd4bf'],
    weight: 30,
  },
  epic: {
    label: 'Epic',
    color: '#fb923c',
    glow: 'rgba(251, 146, 60, 0.65)',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
    shellColors: ['#f97316', '#f43f5e'],
    weight: 15,
  },
  legendary: {
    label: 'Legendary',
    color: '#fde047',
    glow: 'rgba(253, 224, 71, 0.8)',
    badgeBg: 'bg-yellow-400/20 text-yellow-200 border-yellow-300/60',
    shellColors: ['#eab308', '#fef08a'],
    weight: 5,
  },
};

export const PRIZE_POOL: PrizeTemplate[] = [
  // Common
  {
    id: 'ducky',
    name: 'Pixel Duck',
    emoji: '🐥',
    rarity: 'common',
    description: 'Bebek karet edisi arcade yang selalu ceria.',
    points: 100,
  },
  {
    id: 'ramen',
    name: 'Midnight Ramen',
    emoji: '🍜',
    rarity: 'common',
    description: 'Semangkuk ramen hangat untuk menemani lembur.',
    points: 120,
  },
  {
    id: 'boba',
    name: 'Boba Plushie',
    emoji: '🧋',
    rarity: 'common',
    description: 'Boneka boba kenyal dengan level manis 100%.',
    points: 110,
  },
  {
    id: 'cat',
    name: 'Mochi Cat',
    emoji: '🐱',
    rarity: 'common',
    description: 'Kucing bulat selembut mochi strawberry.',
    points: 130,
  },
  {
    id: 'donut',
    name: 'Glazed Donut',
    emoji: '🍩',
    rarity: 'common',
    description: 'Donat tabur meses warna-warni anti-lapar.',
    points: 100,
  },

  // Rare
  {
    id: 'gamepad',
    name: 'Retro Handheld',
    emoji: '🕹️',
    rarity: 'rare',
    description: 'Konsol klasik 8-bit dengan 999 game bawaan.',
    points: 250,
  },
  {
    id: 'alien',
    name: 'Mini Invader',
    emoji: '👾',
    rarity: 'rare',
    description: 'Tamu mungil dari galaksi sebelah.',
    points: 280,
  },
  {
    id: 'frog',
    name: 'Cyber Frog',
    emoji: '🐸',
    rarity: 'rare',
    description: 'Katak neon yang suka melompat di atas synthesizer.',
    points: 260,
  },
  {
    id: 'sushi',
    name: 'Golden Nigiri',
    emoji: '🍣',
    rarity: 'rare',
    description: 'Sushi premium buatan chef robot.',
    points: 300,
  },

  // Epic
  {
    id: 'dragon',
    name: 'Pocket Dragon',
    emoji: '🐉',
    rarity: 'epic',
    description: 'Naga mini yang bisa menyemburkan percikan kembang api.',
    points: 550,
  },
  {
    id: 'rocket',
    name: 'Star Hopper',
    emoji: '🚀',
    rarity: 'epic',
    description: 'Roket mini bertenaga kafein menuju orbit.',
    points: 600,
  },
  {
    id: 'unicorn',
    name: 'Neon Unicorn',
    emoji: '🦄',
    rarity: 'epic',
    description: 'Unicorn bercahaya pelangi dari dimensi vaporwave.',
    points: 580,
  },

  // Legendary
  {
    id: 'crown',
    name: 'Claw Master Crown',
    emoji: '👑',
    rarity: 'legendary',
    description: 'Mahkota emas langka milik sang penakluk mesin capit!',
    points: 1500,
  },
  {
    id: 'gem',
    name: 'Cosmic Prism',
    emoji: '💎',
    rarity: 'legendary',
    description: 'Kristal kosmik yang hanya muncul di mesin capit legendaris.',
    points: 2000,
  },
];

function pickWeightedRarity(): Rarity {
  const entries = Object.entries(RARITY_CONFIG) as [Rarity, (typeof RARITY_CONFIG)[Rarity]][];
  const total = entries.reduce((sum, [, cfg]) => sum + cfg.weight, 0);
  let roll = Math.random() * total;
  for (const [rarity, cfg] of entries) {
    roll -= cfg.weight;
    if (roll <= 0) return rarity;
  }
  return 'common';
}

export function createRandomCapsule(index: number): CapsuleEntity {
  const rarity = pickWeightedRarity();
  const candidates = PRIZE_POOL.filter((p) => p.rarity === rarity);
  const prize = candidates[Math.floor(Math.random() * candidates.length)];
  const cfg = RARITY_CONFIG[rarity];
  const shellColor = cfg.shellColors[Math.floor(Math.random() * cfg.shellColors.length)];

  // Spawn inside playfield while avoiding the front-left prize chute:
  // Chute occupies x in [-2.0, -0.75], z in [0.45, 1.6]
  let x = 0;
  let z = 0;
  for (let attempt = 0; attempt < 20; attempt++) {
    x = -1.6 + Math.random() * 3.2;
    z = -1.25 + Math.random() * 2.5;
    const inChuteZone = x < -0.65 && z > 0.35;
    if (!inChuteZone) break;
  }

  const y = 0.65 + (index % 4) * 0.42 + Math.random() * 0.25;

  return {
    uid: `cap-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    prize,
    position: [x, y, z],
    shellColor,
    accentColor: rarity === 'legendary' ? '#fef08a' : '#ffffff',
  };
}

export function generateInitialCapsules(count = 18): CapsuleEntity[] {
  return Array.from({ length: count }, (_, i) => createRandomCapsule(i));
}
