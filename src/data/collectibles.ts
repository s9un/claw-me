export type Tier = 'C' | 'B' | 'A' | 'SS' | 'SSR';
export type CollectibleKind = 'zonk' | 'letter' | 'animal';

export interface SeriesInfo {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  badge: string;
}

export interface CollectibleItem {
  id: string;
  seriesId: string;
  name: string;
  tier: Tier;
  kind: CollectibleKind;
  letterValue?: 'C' | 'L' | 'A' | 'W' | 'M' | 'E';
  emoji: string;
  accentColor: string;
  description: string;
  points: number;
}

export interface CapsuleEntity {
  uid: string;
  seriesId: string;
  position: [number, number, number];
  shellColor: string;
  accentColor: string;
  isGolden?: boolean;
}

export const SERIES_LIST: SeriesInfo[] = [
  {
    id: 'first-edition',
    name: 'First Edition',
    description: 'Seri perdana: 90 hewan unik + huruf CLAWME!',
    isActive: true,
    badge: 'AKTIF',
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    description: 'Seri edisi bulan depan — segera hadir!',
    isActive: false,
    badge: 'BULAN DEPAN',
  },
];

export const TIER_CONFIG: Record<
  Tier,
  {
    label: string;
    frameName: string;
    chancePercent: number;
    color: string;
    glow: string;
    badgeClass: string;
    frameClass: string;
  }
> = {
  C: {
    label: 'Tier C',
    frameName: 'Standard',
    chancePercent: 58.9,
    color: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.35)',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-400/40',
    frameClass: 'border-slate-500/50 bg-slate-800/80',
  },
  B: {
    label: 'Tier B',
    frameName: 'Bronze',
    chancePercent: 25,
    color: '#d97706',
    glow: 'rgba(217, 119, 6, 0.45)',
    badgeClass: 'bg-amber-700/25 text-amber-300 border-amber-600/50',
    frameClass:
      'border-2 border-amber-600/80 bg-gradient-to-br from-amber-950/90 via-stone-900 to-amber-900/60 shadow-[0_0_15px_rgba(217,119,6,0.25)]',
  },
  A: {
    label: 'Tier A',
    frameName: 'Silver',
    chancePercent: 15,
    color: '#e2e8f0',
    glow: 'rgba(226, 232, 240, 0.55)',
    badgeClass: 'bg-slate-300/20 text-slate-100 border-slate-300/60',
    frameClass:
      'border-2 border-slate-300/85 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-700/80 shadow-[0_0_18px_rgba(226,232,240,0.28)]',
  },
  SS: {
    label: 'Tier SS',
    frameName: 'Gold Futuristic',
    chancePercent: 1,
    color: '#facc15',
    glow: 'rgba(250, 204, 21, 0.7)',
    badgeClass: 'bg-yellow-500/25 text-yellow-200 border-yellow-400/70',
    frameClass:
      'border-2 border-yellow-400 bg-gradient-to-br from-yellow-900/70 via-slate-900 to-amber-700/60 shadow-[0_0_24px_rgba(250,204,21,0.45)]',
  },
  SSR: {
    label: 'Tier SSR',
    frameName: 'Sparkling Diamond',
    chancePercent: 0.1,
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.85)',
    badgeClass: 'bg-cyan-400/25 text-cyan-100 border-cyan-300/80',
    frameClass:
      'border-2 border-cyan-300 bg-gradient-to-br from-cyan-950 via-indigo-950 to-fuchsia-950 shadow-[0_0_30px_rgba(56,189,248,0.65)] ring-2 ring-white/40',
  },
};

export const CLAWME_LETTERS: ('C' | 'L' | 'A' | 'W' | 'M' | 'E')[] = ['C', 'L', 'A', 'W', 'M', 'E'];

const TIER_B_ANIMALS: [string, string][] = [
  ['Mochi Cat', '🐱'], ['Pudding Shiba', '🐶'], ['Boba Bunny', '🐰'], ['Honey Hamster', '🐹'],
  ['Sleepy Bear', '🐻'], ['Bamboo Panda', '🐼'], ['Caramel Fox', '🦊'], ['Chubby Koala', '🐨'],
  ['Baby Tiger', '🐯'], ['Fluffy Lion', '🦁'], ['Milky Cow', '🐮'], ['Pinky Piggy', '🐷'],
  ['Bubble Frog', '🐸'], ['Noodle Monkey', '🐵'], ['Sunny Chick', '🐥'], ['Waddle Penguin', '🐧'],
  ['Cozy Owl', '🦉'], ['Acorn Squirrel', '🐿️'], ['Spiky Hedgehog', '🦔'], ['Mint Duckling', '🦆'],
  ['Strawberry Mouse', '🐭'], ['Velvet Bat', '🦇'], ['Pebble Turtle', '🐢'], ['Coral Seal', '🦭'],
  ['Cloud Alpaca', '🦙'], ['Berry Sloth', '🦥'], ['Cinnamon Otter', '🦦'], ['Marshmallow Lamb', '🐑'],
  ['clover Deer', '🦌'], ['Caramel Pony', '🐴'], ['Peach Flamingo', '🦩'], ['Tangerine Crab', '🦀'],
  ['Sky Dolphin', '🐬'], ['Splash Whale', '🐳'], ['Starry Octopus', '🐙'], ['Lemon Puffer', '🐡'],
  ['Cotton Swan', '🦢'], ['Biscuit Beaver', '🦫'], ['Hazel Badger', '🦡'], ['Mini Kangaroo', '🦘'],
  ['Kiwi Parrot', '🦜'], ['Muffin Dove', '🕊️'], ['Sesame Raccoon', '🦝'], ['Peanut Skunk', '🦨'],
  ['Cupcake Chickadee', '🐤'], ['Jellyfish Puff', '🪼'], ['Cactus Snail', '🐌'], ['Honey Bee', '🐝'],
  ['Ladybug Dot', '🐞'], ['Buttercream Moth', '🦋'],
];

const TIER_A_ANIMALS: [string, string][] = [
  ['Sakura Kitsune', '🦊'], ['Royal Corgi', '🐕'], ['Astronaut Bunny', '🐇'], ['Matcha Red Panda', '🦝'],
  ['Moonlight Cat', '🐈‍⬛'], ['Glacier Polar Bear', '🐻‍❄️'], ['Golden Duck', '🦆'], ['Truffle Piglet', '🐖'],
  ['Emerald Tree Frog', '🐸'], ['Cloud Samoyed', '🐩'], ['Starlight Penguin', '🐧'], ['Maple Owl', '🦉'],
  ['Pearl Otter', '🦦'], ['Crystal Seal', '🦭'], ['Velvet Koala', '🐨'], ['Berry Hedgehog', '🦔'],
  ['Rainbow Parrot', '🦜'], ['Mint Alpaca', '🦙'], ['Aurora Narwhal', '🐳'], ['Coral Seahorse', '🐠'],
  ['Pastel Flamingo', '🦩'], ['Snowy Deer', '🦌'], ['Comet Squirrel', '🐿️'], ['Mochi Swan', '🦢'],
  ['Boba Axolotl', '🦎'],
];

const TIER_SS_ANIMALS: [string, string][] = [
  ['Cyber Mecha Wolf', '🐺'], ['Neon Plasma Tiger', '🐯'], ['Holo Visor Panther', '🐆'], ['Quantum Falcon', '🦅'],
  ['Laser Mantis', '🦗'], ['Chrome Cobra', '🐍'], ['Hyperion Fox', '🦊'], ['Orbital Bear', '🐻'],
  ['Pulse Shark', '🦈'], ['Volt Griffin', '🦅'],
];

const TIER_SSR_ANIMALS: [string, string][] = [
  ['Abyssal Inferno Dragon', '🐉'], ['Apex Thunder Rex', '🦖'], ['Celestial Void Phoenix', '🐦‍🔥'],
  ['Obsidian Saber Lion', '🦁'], ['Galactic Leviathan', '🐋'],
];

function buildFirstEditionCollectibles(): CollectibleItem[] {
  const items: CollectibleItem[] = [];

  // Tier C: Zonk + 6 CLAWME letters
  items.push({
    id: 'zonk',
    seriesId: 'first-edition',
    name: 'Zonk! Kapsul Kosong',
    tier: 'C',
    kind: 'zonk',
    emoji: '💨',
    accentColor: '#64748b',
    description: 'Ups, kapsul ini kosong! Jangan menyerah, coba capit lagi.',
    points: 0,
  });

  CLAWME_LETTERS.forEach((letter) => {
    items.push({
      id: `letter-${letter}`,
      seriesId: 'first-edition',
      name: `Huruf "${letter}"`,
      tier: 'C',
      kind: 'letter',
      letterValue: letter,
      emoji: letter,
      accentColor: '#38bdf8',
      description: `Sticker huruf ${letter}. Kumpulkan C-L-A-W-M-E lengkap untuk ditukar 5 token gratis!`,
      points: 25,
    });
  });

  // Tier B: 50 Cute Animals (Bronze)
  TIER_B_ANIMALS.forEach(([name, emoji], idx) => {
    items.push({
      id: `b-${String(idx + 1).padStart(2, '0')}`,
      seriesId: 'first-edition',
      name,
      tier: 'B',
      kind: 'animal',
      emoji,
      accentColor: '#d97706',
      description: `Koleksi hewan lucu edisi Bronze #${idx + 1}.`,
      points: 100,
    });
  });

  // Tier A: 25 Cute Animals (Silver)
  TIER_A_ANIMALS.forEach(([name, emoji], idx) => {
    items.push({
      id: `a-${String(idx + 1).padStart(2, '0')}`,
      seriesId: 'first-edition',
      name,
      tier: 'A',
      kind: 'animal',
      emoji,
      accentColor: '#e2e8f0',
      description: `Koleksi hewan lucu edisi Silver #${idx + 1}.`,
      points: 250,
    });
  });

  // Tier SS: 10 Futuristic Cool Animals (Gold)
  TIER_SS_ANIMALS.forEach(([name, emoji], idx) => {
    items.push({
      id: `ss-${String(idx + 1).padStart(2, '0')}`,
      seriesId: 'first-edition',
      name,
      tier: 'SS',
      kind: 'animal',
      emoji,
      accentColor: '#facc15',
      description: `Hewan futuristik edisi Gold #${idx + 1} dengan aura energi siber!`,
      points: 750,
    });
  });

  // Tier SSR: 5 Fierce Cool Animals (Sparkling Diamond)
  TIER_SSR_ANIMALS.forEach(([name, emoji], idx) => {
    items.push({
      id: `ssr-${String(idx + 1).padStart(2, '0')}`,
      seriesId: 'first-edition',
      name,
      tier: 'SSR',
      kind: 'animal',
      emoji,
      accentColor: '#38bdf8',
      description: `Hewan sangar legendaris edisi Sparkling Diamond #${idx + 1}!`,
      points: 2500,
    });
  });

  return items;
}

export const FIRST_EDITION_COLLECTIBLES: CollectibleItem[] = buildFirstEditionCollectibles();

export function getCollectiblesBySeries(seriesId: string): CollectibleItem[] {
  if (seriesId === 'first-edition') return FIRST_EDITION_COLLECTIBLES;
  return [];
}

/**
 * Roll tier based on Rule #17 (58.9% C, 25% B, 15% A, 1% SS, 0.1% SSR)
 */
export function rollCollectibleOutcome(seriesId: string): CollectibleItem {
  const pool = getCollectiblesBySeries(seriesId);
  const roll = Math.random() * 100;

  let chosenTier: Tier = 'C';
  if (roll < 0.1) chosenTier = 'SSR';
  else if (roll < 1.1) chosenTier = 'SS';
  else if (roll < 16.1) chosenTier = 'A';
  else if (roll < 41.1) chosenTier = 'B';
  else chosenTier = 'C';

  if (chosenTier === 'C') {
    // 35% Zonk, 65% one of C/L/A/W/M/E
    if (Math.random() < 0.35) {
      return pool.find((i) => i.id === 'zonk')!;
    }
    const letters = pool.filter((i) => i.kind === 'letter');
    return letters[Math.floor(Math.random() * letters.length)];
  }

  const tierPool = pool.filter((i) => i.tier === chosenTier);
  return tierPool[Math.floor(Math.random() * tierPool.length)];
}

const CAPSULE_COLORS = ['#38bdf8', '#fb7185', '#a855f7', '#4ade80', '#facc15', '#f97316'];

export function createRandomCapsule(index: number, seriesId = 'first-edition'): CapsuleEntity {
  let x = 0;
  let z = 0;
  for (let attempt = 0; attempt < 20; attempt++) {
    x = -1.6 + Math.random() * 3.2;
    z = -1.25 + Math.random() * 2.5;
    if (!(x < -0.65 && z > 0.35)) break;
  }

  const isGolden = Math.random() < 0.12;
  const shellColor = isGolden
    ? '#eab308'
    : CAPSULE_COLORS[Math.floor(Math.random() * CAPSULE_COLORS.length)];

  return {
    uid: `cap-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    seriesId,
    position: [x, 0.65 + (index % 4) * 0.42 + Math.random() * 0.25, z],
    shellColor,
    accentColor: isGolden ? '#fef08a' : '#ffffff',
    isGolden,
  };
}

export function generateInitialCapsules(count = 18, seriesId = 'first-edition'): CapsuleEntity[] {
  return Array.from({ length: count }, (_, i) => createRandomCapsule(i, seriesId));
}
