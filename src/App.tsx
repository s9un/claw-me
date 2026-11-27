import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Coins,
  Edit3,
  Flame,
  Layers,
  LogIn,
  LogOut,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AlbumModal } from './components/AlbumModal';
import { AuthModal } from './components/AuthModal';
import { CapsuleRevealModal } from './components/CapsuleRevealModal';
import { ClawMachineScene } from './components/ClawMachineScene';
import type { ClawPhase } from './components/ClawRig';
import { PityBonusModal } from './components/PityBonusModal';
import { SaweriaModal } from './components/SaweriaModal';
import { UsernameModal } from './components/UsernameModal';
import {
  createRandomCapsule,
  DEFAULT_RARITY_RATES,
  generateInitialCapsules,
  getCollectiblesBySeries,
  rollCollectibleOutcome,
  SERIES_LIST,
  type CapsuleEntity,
  type CollectibleItem,
  type RarityRatesConfig,
} from './data/collectibles';
import { GAME_MODES, type GameModeId } from './data/gameModes';
import { supabase } from './lib/supabase';
import { soundEngine } from './utils/sound';
import { getTimeUntilWibMidnight, getTodayWibDateString } from './utils/timeWib';

const GUEST_TOKENS_KEY = 'capit-guest-tokens-v1';
const GUEST_RESET_DATE_KEY = 'capit-guest-reset-date-v1';

export function App() {
  const [gameModeId, setGameModeId] = useState<GameModeId>('classic');
  const activeMode = GAME_MODES[gameModeId];
  const [activeSeriesId, setActiveSeriesId] = useState('first-edition');
  const [capsules, setCapsules] = useState<CapsuleEntity[]>(() =>
    generateInitialCapsules(18, 'first-edition')
  );

  // Guest tokens (max 3, resets daily at 00:00 AM GMT+7)
  const [guestTokens, setGuestTokens] = useState<number>(() => {
    try {
      const todayWib = getTodayWibDateString();
      const savedDate = localStorage.getItem(GUEST_RESET_DATE_KEY);
      if (savedDate !== todayWib) {
        localStorage.setItem(GUEST_RESET_DATE_KEY, todayWib);
        localStorage.setItem(GUEST_TOKENS_KEY, '3');
        return 3;
      }
      const raw = localStorage.getItem(GUEST_TOKENS_KEY);
      if (raw !== null) return Math.min(3, Math.max(0, Number(raw)));
    } catch {
      // ignore
    }
    return 3;
  });

  // Logged-in user state & cloud balances
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [freeTokens, setFreeTokens] = useState(0);
  const [paidTokens, setPaidTokens] = useState(0);
  const [pityCounter, setPityCounter] = useState(0);
  const [pityBonusActive, setPityBonusActive] = useState(false);

  // Database-driven drop rate & catch config (Rule #5)
  const [rarityRates, setRarityRates] = useState<RarityRatesConfig>(DEFAULT_RARITY_RATES);
  const [dbCatchNormal, setDbCatchNormal] = useState<number | null>(null);
  const [dbCatchPity, setDbCatchPity] = useState<number | null>(null);
  const [pityThreshold, setPityThreshold] = useState<number>(10);

  // Owned counts keyed by `${seriesId}:${collectibleId}` (logged-in users only)
  const [ownedCounts, setOwnedCounts] = useState<Record<string, number>>({});

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [usernameRequired, setUsernameRequired] = useState(false);
  const [saweriaModalOpen, setSaweriaModalOpen] = useState(false);
  const [pityModalOpen, setPityModalOpen] = useState(false);
  const [albumOpen, setAlbumOpen] = useState(false);

  const [clawPhase, setClawPhase] = useState<ClawPhase>('idle');
  const [dropSignal, setDropSignal] = useState(0);
  const [pendingReveal, setPendingReveal] = useState<{
    capsule: CapsuleEntity;
    prize: CollectibleItem;
  } | null>(null);

  const [muted, setMuted] = useState(false);
  const [statusText, setStatusText] = useState(
    'Mode Tamu (maks 3x main, chance 30%). Arahkan capit & tekan SPASI!'
  );

  const keysRef = useRef<Set<string>>(new Set());
  const padRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const [inputVector, setInputVector] = useState({ x: 0, z: 0 });
  const usedPityOnCurrentTurnRef = useRef(false);

  const catchChance = user
    ? pityBonusActive
      ? (dbCatchPity ?? activeMode.pityCatchChance)
      : (dbCatchNormal ?? activeMode.normalCatchChance)
    : activeMode.guestCatchChance;

  const unlockedAnimalsCount = useMemo(() => {
    const animals = getCollectiblesBySeries(activeSeriesId).filter((i) => i.kind === 'animal');
    return animals.filter((i) => (ownedCounts[`${activeSeriesId}:${i.id}`] ?? 0) > 0).length;
  }, [activeSeriesId, ownedCounts]);

  // Persist guest token count only (Rule #2: guest prizes are NOT saved)
  useEffect(() => {
    if (user) return;
    try {
      localStorage.setItem(GUEST_TOKENS_KEY, String(guestTokens));
    } catch {
      // ignore
    }
  }, [guestTokens, user]);

  // Load game_config from Supabase database (Rule #5)
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('game_config')
      .select(
        'catch_chance_normal, catch_chance_pity, pity_threshold, tier_c_chance, tier_b_chance, tier_a_chance, tier_ss_chance, tier_ssr_chance'
      )
      .eq('id', 'default')
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setDbCatchNormal(Number(data.catch_chance_normal));
        setDbCatchPity(Number(data.catch_chance_pity));
        setPityThreshold(Number(data.pity_threshold));
        setRarityRates({
          tierC: Number(data.tier_c_chance),
          tierB: Number(data.tier_b_chance),
          tierA: Number(data.tier_a_chance),
          tierSS: Number(data.tier_ss_chance),
          tierSSR: Number(data.tier_ssr_chance),
        });
      });
  }, []);

  // Sync user profile, daily GMT+7 tokens, and collectibles
  const syncUserData = useCallback(async (loggedUser: User) => {
    if (!supabase) return;

    // 1. Claim daily +3 free tokens if new GMT+7 day
    const { data: claimData } = await supabase.rpc('claim_daily_tokens');

    // 2. Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, free_tokens, paid_tokens, pity_counter, pity_bonus_active')
      .eq('id', loggedUser.id)
      .maybeSingle();

    if (profile) {
      setUsername(profile.username as string | null);
      setFreeTokens(profile.free_tokens as number);
      setPaidTokens(profile.paid_tokens as number);
      setPityCounter(profile.pity_counter as number);
      setPityBonusActive(profile.pity_bonus_active as boolean);

      if (!profile.username) {
        setUsernameRequired(true);
        setUsernameModalOpen(true);
      } else if ((claimData as { claimed?: boolean } | null)?.claimed) {
        soundEngine.playCoin();
        setStatusText('Selamat datang! +3 Token Gratis harian (GMT+7) telah ditambahkan!');
      }
    }

    // 3. Fetch user collectibles
    const { data: rows } = await supabase
      .from('user_collectibles')
      .select('series_id, collectible_id, quantity')
      .eq('user_id', loggedUser.id);

    if (rows) {
      const map: Record<string, number> = {};
      rows.forEach((r) => {
        map[`${r.series_id}:${r.collectible_id}`] = r.quantity as number;
      });
      setOwnedCounts(map);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      const current = data.session?.user ?? null;
      setUser(current);
      if (current) syncUserData(current);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null;
      setUser(next);
      if (next) {
        setAuthModalOpen(false);
        syncUserData(next);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [syncUserData]);

  const recomputeInput = useCallback(() => {
    const keys = keysRef.current;
    let x = padRef.current.x;
    let z = padRef.current.z;

    if (keys.has('ArrowLeft') || keys.has('KeyA')) x -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) x += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) z -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) z += 1;

    setInputVector({
      x: Math.max(-1, Math.min(1, x)),
      z: Math.max(-1, Math.min(1, z)),
    });
  }, []);

  const triggerDrop = useCallback(() => {
    if (
      clawPhase !== 'idle' ||
      pendingReveal ||
      albumOpen ||
      authModalOpen ||
      usernameModalOpen ||
      saweriaModalOpen ||
      pityModalOpen
    ) {
      return;
    }

    if (!user) {
      if (guestTokens <= 0) {
        setAuthModalOpen(true);
        setStatusText('3x percobaan tamu habis! Silakan login dengan Google.');
        return;
      }
      setGuestTokens((t) => Math.max(0, t - 1));
      usedPityOnCurrentTurnRef.current = false;
      setDropSignal((s) => s + 1);
      setStatusText('Menurunkan capit...');
      return;
    }

    // Logged-in user: prioritize free_tokens first, then paid_tokens
    if (freeTokens + paidTokens <= 0) {
      setSaweriaModalOpen(true);
      setStatusText('Token habis! Top-up melalui Saweria.co untuk melanjutkan.');
      return;
    }

    let nextFree = freeTokens;
    let nextPaid = paidTokens;
    if (nextFree > 0) {
      nextFree -= 1;
    } else {
      nextPaid -= 1;
    }

    setFreeTokens(nextFree);
    setPaidTokens(nextPaid);
    usedPityOnCurrentTurnRef.current = pityBonusActive;

    if (supabase) {
      supabase
        .from('profiles')
        .update({
          free_tokens: nextFree,
          paid_tokens: nextPaid,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .then(() => {});
    }

    setDropSignal((s) => s + 1);
    setStatusText(
      pityBonusActive
        ? 'PITY BONUS 90% AKTIF! Menurunkan capit...'
        : 'Menurunkan capit...'
    );
  }, [
    albumOpen,
    authModalOpen,
    clawPhase,
    freeTokens,
    guestTokens,
    paidTokens,
    pendingReveal,
    pityBonusActive,
    pityModalOpen,
    saweriaModalOpen,
    user,
    usernameModalOpen,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (usernameModalOpen) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        if (!e.repeat) triggerDrop();
        return;
      }
      keysRef.current.add(e.code);
      recomputeInput();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
      recomputeInput();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [recomputeInput, triggerDrop, usernameModalOpen]);

  const handlePhaseChange = useCallback((phase: ClawPhase) => {
    setClawPhase(phase);
    if (phase === 'closing') setStatusText('Mencengkeram kapsul...');
    else if (phase === 'lifting') setStatusText('Mengangkat ke atas...');
    else if (phase === 'returning') setStatusText('Menuju Drop Zone...');
    else if (phase === 'releasing') setStatusText('Melepaskan...');
  }, []);

  const handleCapsuleWon = useCallback(
    (uid: string) => {
      setCapsules((prev) => {
        const wonCapsule = prev.find((c) => c.uid === uid);
        if (!wonCapsule) return prev;

        soundEngine.playWin();
        const rolledPrize = rollCollectibleOutcome(activeSeriesId, rarityRates);
        setPendingReveal({ capsule: wonCapsule, prize: rolledPrize });

        // Reset pity on successful catch
        if (user) {
          setPityCounter(0);
          setPityBonusActive(false);
          if (supabase) {
            supabase
              .from('profiles')
              .update({
                pity_counter: 0,
                pity_bonus_active: false,
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id)
              .then(() => {});
          }
        }

        // Save collectible ONLY for logged-in users (Rule #2: guest prizes are never saved)
        if (user && rolledPrize.kind !== 'zonk') {
          const key = `${activeSeriesId}:${rolledPrize.id}`;
          setOwnedCounts((curr) => {
            const nextQty = (curr[key] ?? 0) + 1;
            if (supabase) {
              supabase
                .from('user_collectibles')
                .upsert(
                  {
                    user_id: user.id,
                    series_id: activeSeriesId,
                    collectible_id: rolledPrize.id,
                    tier: rolledPrize.tier,
                    quantity: nextQty,
                    last_obtained_at: new Date().toISOString(),
                  },
                  { onConflict: 'user_id,series_id,collectible_id' }
                )
                .then(() => {});
            }
            return { ...curr, [key]: nextQty };
          });
        }

        setStatusText(
          user
            ? `Kapsul masuk Drop Zone! Buka untuk melihat hadiah ${rolledPrize.tier}.`
            : 'Mode Tamu: kapsul terbuka (hadiah tamu tidak disimpan ke akun).'
        );

        const remaining = prev.filter((c) => c.uid !== uid);
        if (remaining.length < 8) {
          const refill = Array.from({ length: 6 }, (_, i) =>
            createRandomCapsule(i, activeSeriesId)
          );
          return [...remaining, ...refill];
        }
        return remaining;
      });
    },
    [activeSeriesId, rarityRates, user]
  );

  const handleAttemptFinished = useCallback(
    (grabbedSomething: boolean) => {
      if (grabbedSomething) return;

      if (!user) {
        if (guestTokens <= 0) {
          setStatusText('Kesempatan tamu habis! Login untuk dapat 3 token gratis tiap hari.');
          setAuthModalOpen(true);
        } else {
          setStatusText('Capit lepas! Geser posisi dan coba lagi.');
        }
        return;
      }

      // Logged-in Pity System: 10x fail -> 90% bonus on next play
      let nextPity = pityCounter + 1;
      let nextBonus = false;

      if (usedPityOnCurrentTurnRef.current) {
        nextPity = 0;
        nextBonus = false;
      } else if (nextPity >= pityThreshold) {
        nextBonus = true;
        setPityModalOpen(true);
      }

      setPityCounter(nextPity);
      setPityBonusActive(nextBonus);

      if (supabase) {
        supabase
          .from('profiles')
          .update({
            pity_counter: nextPity,
            pity_bonus_active: nextBonus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .then(() => {});
      }

      if (freeTokens + paidTokens <= 0 && !nextBonus) {
        setSaweriaModalOpen(true);
        setStatusText('Token habis! Top-up di Saweria.co untuk lanjut.');
      } else {
        setStatusText(`Capit lepas! Pity counter: ${nextPity}/10`);
      }
    },
    [freeTokens, guestTokens, paidTokens, pityCounter, pityThreshold, user]
  );

  const handleSaveUsername = async (newUsername: string): Promise<string | null> => {
    if (!supabase || !user) return 'Belum login';
    const { data, error } = await supabase.rpc('set_username', { new_username: newUsername });
    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return 'Username sudah dipakai pemain lain, coba yang lain.';
      }
      return error.message;
    }
    setUsername((data as string) || newUsername);
    setUsernameRequired(false);
    setStatusText(`Username "${newUsername}" berhasil disimpan!`);
    return null;
  };

  const handleRedeemClawme = async (seriesId: string) => {
    if (!supabase || !user) return;
    const { data, error } = await supabase.rpc('redeem_clawme', { target_series: seriesId });
    if (!error && typeof data === 'number') {
      soundEngine.playCoin();
      setFreeTokens(data);
      setOwnedCounts((curr) => {
        const copy = { ...curr };
        (['C', 'L', 'A', 'W', 'M', 'E'] as const).forEach((ltr) => {
          const k = `${seriesId}:letter-${ltr}`;
          copy[k] = Math.max(0, (copy[k] ?? 1) - 1);
        });
        return copy;
      });
      setStatusText('Berhasil menukar CLAWME dengan +5 Token Gratis!');
    }
  };

  const handleSeriesChange = (nextSeriesId: string) => {
    const info = SERIES_LIST.find((s) => s.id === nextSeriesId);
    if (!info || !info.isActive) {
      setStatusText('Seri ini akan hadir bulan depan!');
      return;
    }
    setActiveSeriesId(nextSeriesId);
    setCapsules(generateInitialCapsules(18, nextSeriesId));
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setUsername(null);
    setFreeTokens(0);
    setPaidTokens(0);
    setPityCounter(0);
    setPityBonusActive(false);
    setStatusText('Keluar berhasil. Kembali ke mode tamu.');
  };

  // Allow claw movement/drop whenever no modal is open; token checks happen in triggerDrop()
  const canPlay =
    !pendingReveal &&
    !albumOpen &&
    !authModalOpen &&
    !usernameModalOpen &&
    !saweriaModalOpen &&
    !pityModalOpen;

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-[#090714]">
      <ClawMachineScene
        capsules={capsules}
        inputVector={inputVector}
        dropSignal={dropSignal}
        canPlay={canPlay}
        isDropping={clawPhase === 'dropping' || clawPhase === 'closing'}
        catchChance={catchChance}
        onPhaseChange={handlePhaseChange}
        onCapsuleWon={handleCapsuleWon}
        onAttemptFinished={handleAttemptFinished}
      />

      {/* Top HUD */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-3 p-4">
        {/* Left: Brand, Series Picker & Status */}
        <div className="pointer-events-auto flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-white/15 bg-slate-950/75 px-4 py-2 backdrop-blur-md">
            <Sparkles className="h-5 w-5 text-pink-400" />
            <h1 className="font-display bg-gradient-to-r from-yellow-200 via-pink-300 to-cyan-300 bg-clip-text text-xl font-bold tracking-wide text-transparent">
              CAPIT
            </h1>

            {/* Mode Selector (Scalable) */}
            <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-slate-900 px-2.5 py-1">
              <select
                value={gameModeId}
                onChange={(e) => {
                  const id = e.target.value as GameModeId;
                  if (GAME_MODES[id].isAvailable) {
                    setGameModeId(id);
                  } else {
                    setStatusText(`${GAME_MODES[id].name} akan hadir pada update berikutnya!`);
                  }
                }}
                className="bg-transparent text-xs font-semibold text-pink-200 focus:outline-none"
                aria-label="Pilih Mode Permainan"
              >
                {Object.values(GAME_MODES).map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Series Selector */}
            <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-slate-900 px-2.5 py-1">
              <Layers className="h-3.5 w-3.5 text-cyan-300" />
              <select
                value={activeSeriesId}
                onChange={(e) => handleSeriesChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none"
              >
                {SERIES_LIST.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.name} ({s.badge})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl border border-white/10 bg-slate-950/65 px-3 py-1.5 text-xs text-slate-300 backdrop-blur-md">
              {statusText}
            </div>
            {user && (
              <div
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold backdrop-blur-md ${
                  pityBonusActive
                    ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                    : 'border-white/10 bg-slate-950/65 text-slate-300'
                }`}
              >
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>{pityBonusActive ? 'PITY 90%!' : `Pity ${pityCounter}/10`}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: User, Tokens (Free + Paid), Album, Refill, Mute */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-slate-950/75 px-3 py-1.5 backdrop-blur-md">
              <button
                onClick={() => {
                  setUsernameRequired(false);
                  setUsernameModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200 hover:underline"
                title="Ubah Username"
              >
                <span>@{username || 'set_username'}</span>
                <Edit3 className="h-3 w-3 opacity-75" />
              </button>
              <button
                onClick={handleLogout}
                title="Keluar"
                className="rounded-lg bg-white/10 p-1 text-slate-300 transition hover:bg-rose-500/30 hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl border border-cyan-400/35 bg-cyan-500/15 px-3.5 py-2 text-xs font-semibold text-cyan-200 backdrop-blur-md transition hover:bg-cyan-500/25 active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              <span>Login Google</span>
            </button>
          )}

          {/* CCoin Stacked Display (Top: Free Blue, Bottom: Paid Yellow) */}
          <div
            className="flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-950/80 px-3 py-1.5 backdrop-blur-md"
            title={
              user
                ? `CCoin Free: ${freeTokens} | CCoin Paid: ${paidTokens} • Reset harian GMT+7 dalam ${getTimeUntilWibMidnight()}`
                : `CCoin Free Tamu (maks 3/hari) • Reset GMT+7 dalam ${getTimeUntilWibMidnight()}`
            }
          >
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1 text-[11px] font-bold text-sky-400 sm:text-xs">
                <Coins className="h-3.5 w-3.5 shrink-0" />
                <span>CCoin Free:</span>
                <span className="font-display text-xs text-sky-300 sm:text-sm">
                  {user ? freeTokens : `${guestTokens}/3`}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-amber-400 sm:text-xs">
                <Coins className="h-3.5 w-3.5 shrink-0" />
                <span>CCoin Paid:</span>
                <span className="font-display text-xs text-amber-300 sm:text-sm">
                  {user ? paidTokens : 0}
                </span>
              </div>
            </div>

            {user && (
              <button
                onClick={() => setSaweriaModalOpen(true)}
                className="rounded-xl bg-amber-400/20 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 transition hover:bg-amber-400/35 active:scale-95"
              >
                + Beli
              </button>
            )}
          </div>

          <button
            onClick={() => setAlbumOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-purple-400/30 bg-slate-950/75 px-3.5 py-2 text-sm font-semibold text-purple-200 backdrop-blur-md transition hover:bg-purple-500/20 active:scale-95"
          >
            <Trophy className="h-4 w-4 text-purple-300" />
            <span>Album ({unlockedAnimalsCount}/90)</span>
          </button>

          <button
            onClick={() => {
              setCapsules(generateInitialCapsules(18, activeSeriesId));
              setStatusText('Kapsul di dalam mesin telah diacak ulang!');
            }}
            title="Acak Ulang Kapsul"
            className="rounded-2xl border border-white/15 bg-slate-950/75 p-2.5 text-slate-300 backdrop-blur-md transition hover:bg-white/15 hover:text-white active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              soundEngine.muted = !muted;
              setMuted(!muted);
            }}
            title={muted ? 'Nyalakan Suara' : 'Bisukan Suara'}
            className="rounded-2xl border border-white/15 bg-slate-950/75 p-2.5 text-slate-300 backdrop-blur-md transition hover:bg-white/15 hover:text-white active:scale-95"
          >
            {muted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div className="pointer-events-none fixed bottom-4 left-4 z-10 hidden rounded-xl border border-white/10 bg-slate-950/60 px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur-md md:block">
        Drag layar untuk putar kamera • Scroll untuk zoom • Waktu GMT+7
      </div>

      {/* Bottom Arcade Controls (Mobile Touch Optimized) */}
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex items-end justify-center px-3 sm:bottom-4 sm:px-4">
        <div className="pointer-events-auto touch-none flex items-center gap-4 rounded-3xl border border-white/15 bg-slate-950/85 px-4 py-2.5 shadow-2xl backdrop-blur-md sm:gap-5 sm:px-5 sm:py-3">
          <div className="grid grid-cols-3 gap-1.5">
            <div />
            <button
              onPointerDown={() => {
                padRef.current = { x: 0, z: -1 };
                recomputeInput();
              }}
              onPointerUp={() => {
                padRef.current = { x: 0, z: 0 };
                recomputeInput();
              }}
              onPointerLeave={() => {
                padRef.current = { x: 0, z: 0 };
                recomputeInput();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-cyan-500/30 active:scale-90"
              aria-label="Maju"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <div />

            <button
              onPointerDown={() => {
                padRef.current = { x: -1, z: 0 };
                recomputeInput();
              }}
              onPointerUp={() => {
                padRef.current = { x: 0, z: 0 };
                recomputeInput();
              }}
              onPointerLeave={() => {
                padRef.current = { x: 0, z: 0 };
                recomputeInput();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-cyan-500/30 active:scale-90"
              aria-label="Kiri"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onPointerDown={() => {
                padRef.current = { x: 0, z: 1 };
                recomputeInput();
              }}
              onPointerUp={() => {
                padRef.current = { x: 0, z: 0 };
                recomputeInput();
              }}
              onPointerLeave={() => {
                padRef.current = { x: 0, z: 0 };
                recomputeInput();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-cyan-500/30 active:scale-90"
              aria-label="Mundur"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              onPointerDown={() => {
                padRef.current = { x: 1, z: 0 };
                recomputeInput();
              }}
              onPointerUp={() => {
                padRef.current = { x: 0, z: 0 };
                recomputeInput();
              }}
              onPointerLeave={() => {
                padRef.current = { x: 0, z: 0 };
                recomputeInput();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-cyan-500/30 active:scale-90"
              aria-label="Kanan"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={triggerDrop}
            disabled={clawPhase !== 'idle'}
            className="font-display flex h-16 min-w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 px-6 text-lg font-bold tracking-wider text-white shadow-lg shadow-pink-500/35 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {clawPhase === 'idle' ? 'CAPIT!' : 'PROSES...'}
          </button>
        </div>
      </div>

      {/* Modals */}
      <CapsuleRevealModal
        capsule={pendingReveal?.capsule ?? null}
        prize={pendingReveal?.prize ?? null}
        isGuest={!user}
        onClose={() => setPendingReveal(null)}
      />

      <AlbumModal
        open={albumOpen}
        activeSeriesId={activeSeriesId}
        ownedCounts={ownedCounts}
        isLoggedIn={Boolean(user)}
        onRedeemClawme={handleRedeemClawme}
        onClose={() => setAlbumOpen(false)}
      />

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      <UsernameModal
        open={usernameModalOpen}
        required={usernameRequired}
        currentUsername={username}
        onSave={handleSaveUsername}
        onClose={() => setUsernameModalOpen(false)}
      />

      <SaweriaModal
        open={saweriaModalOpen}
        username={username}
        onClose={() => setSaweriaModalOpen(false)}
      />

      <PityBonusModal open={pityModalOpen} onClose={() => setPityModalOpen(false)} />
    </div>
  );
}

export default App;
