import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Coins,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CapsuleRevealModal } from './components/CapsuleRevealModal';
import { ClawMachineScene } from './components/ClawMachineScene';
import type { ClawPhase } from './components/ClawRig';
import { CollectionDrawer } from './components/CollectionDrawer';
import {
  createRandomCapsule,
  generateInitialCapsules,
  type CapsuleEntity,
  type CollectedPrize,
} from './data/prizes';
import { soundEngine } from './utils/sound';

const STORAGE_KEY = 'claw-me-collection-v1';

export function App() {
  const [capsules, setCapsules] = useState<CapsuleEntity[]>(() => generateInitialCapsules(18));
  const [coins, setCoins] = useState(5);
  const [collection, setCollection] = useState<CollectedPrize[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CollectedPrize[]) : [];
    } catch {
      return [];
    }
  });

  const [clawPhase, setClawPhase] = useState<ClawPhase>('idle');
  const [dropSignal, setDropSignal] = useState(0);
  const [pendingReveal, setPendingReveal] = useState<CapsuleEntity | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [statusText, setStatusText] = useState('Arahkan capit dengan WASD / Panah, lalu tekan SPASI!');

  // Movement input state (keyboard + on-screen D-pad)
  const keysRef = useRef<Set<string>>(new Set());
  const padRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const [inputVector, setInputVector] = useState({ x: 0, z: 0 });

  const totalPoints = useMemo(
    () => collection.reduce((sum, item) => sum + item.points, 0),
    [collection]
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    } catch {
      // Ignore storage quota errors
    }
  }, [collection]);

  const recomputeInput = useCallback(() => {
    const keys = keysRef.current;
    let x = padRef.current.x;
    let z = padRef.current.z;

    if (keys.has('ArrowLeft') || keys.has('KeyA')) x -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) x += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) z -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) z += 1;

    x = Math.max(-1, Math.min(1, x));
    z = Math.max(-1, Math.min(1, z));
    setInputVector({ x, z });
  }, []);

  const triggerDrop = useCallback(() => {
    if (clawPhase !== 'idle' || pendingReveal || drawerOpen) return;
    if (coins <= 0) {
      setStatusText('Koin habis! Klik "+5 Koin" untuk lanjut bermain.');
      return;
    }
    setCoins((c) => c - 1);
    setDropSignal((s) => s + 1);
    setStatusText('Menurunkan capit...');
  }, [clawPhase, coins, drawerOpen, pendingReveal]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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
  }, [recomputeInput, triggerDrop]);

  const handlePadPress = (dx: number, dz: number) => {
    padRef.current = { x: dx, z: dz };
    recomputeInput();
  };

  const handlePadRelease = () => {
    padRef.current = { x: 0, z: 0 };
    recomputeInput();
  };

  const handlePhaseChange = useCallback((phase: ClawPhase) => {
    setClawPhase(phase);
    if (phase === 'closing') setStatusText('Mencengkeram kapsul...');
    else if (phase === 'lifting') setStatusText('Mengangkat ke atas...');
    else if (phase === 'returning') setStatusText('Menuju Drop Zone...');
    else if (phase === 'releasing') setStatusText('Melepaskan...');
  }, []);

  const handleCapsuleWon = useCallback((uid: string) => {
    setCapsules((prev) => {
      const won = prev.find((c) => c.uid === uid);
      if (!won) return prev;

      soundEngine.playWin();
      setPendingReveal(won);
      setCollection((col) => [
        { ...won.prize, uid: won.uid, collectedAt: Date.now() },
        ...col,
      ]);
      setStatusText(`Yeay! Kamu mendapatkan kapsul ${won.prize.rarity.toUpperCase()}!`);

      const remaining = prev.filter((c) => c.uid !== uid);
      if (remaining.length < 8) {
        const refill = Array.from({ length: 6 }, (_, i) => createRandomCapsule(i));
        return [...remaining, ...refill];
      }
      return remaining;
    });
  }, []);

  const handleAttemptFinished = useCallback((grabbedSomething: boolean) => {
    if (!grabbedSomething) {
      setStatusText('Belum kena! Geser posisi capit dan coba lagi.');
    }
  }, []);

  const handleInsertCoins = () => {
    soundEngine.playCoin();
    setCoins((c) => c + 5);
    setStatusText('+5 Koin dimasukkan! Selamat bermain.');
  };

  const handleResetCapsules = () => {
    setCapsules(generateInitialCapsules(18));
    setStatusText('Kapsul di dalam mesin telah diisi ulang!');
  };

  const toggleMute = () => {
    soundEngine.muted = !muted;
    setMuted(!muted);
  };

  const canPlay = coins > 0 && !pendingReveal && !drawerOpen;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#090714]">
      {/* 3D Canvas */}
      <ClawMachineScene
        capsules={capsules}
        inputVector={inputVector}
        dropSignal={dropSignal}
        canPlay={canPlay}
        isDropping={clawPhase === 'dropping' || clawPhase === 'closing'}
        onPhaseChange={handlePhaseChange}
        onCapsuleWon={handleCapsuleWon}
        onAttemptFinished={handleAttemptFinished}
      />

      {/* Top HUD */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-3 p-4">
        {/* Brand & Status */}
        <div className="pointer-events-auto flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-slate-950/75 px-4 py-2 backdrop-blur-md">
            <Sparkles className="h-5 w-5 text-pink-400" />
            <h1 className="font-display bg-gradient-to-r from-yellow-200 via-pink-300 to-cyan-300 bg-clip-text text-xl font-bold tracking-wide text-transparent">
              CLAW ME!
            </h1>
            <span className="hidden rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-300 sm:inline-block">
              3D Gacha Arcade
            </span>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/65 px-3 py-1.5 text-xs text-slate-300 backdrop-blur-md">
            {statusText}
          </div>
        </div>

        {/* Right Controls: Coins, Collection, Refill, Mute */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-slate-950/75 px-3.5 py-2 backdrop-blur-md">
            <Coins className="h-4 w-4 text-amber-400" />
            <span className="font-display text-base font-bold text-amber-300">{coins}</span>
            <button
              onClick={handleInsertCoins}
              className="ml-1 rounded-lg bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/35 active:scale-95"
            >
              +5 Koin
            </button>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-purple-400/30 bg-slate-950/75 px-3.5 py-2 text-sm font-semibold text-purple-200 backdrop-blur-md transition hover:bg-purple-500/20 active:scale-95"
          >
            <Trophy className="h-4 w-4 text-purple-300" />
            <span>Koleksi ({collection.length})</span>
          </button>

          <button
            onClick={handleResetCapsules}
            title="Isi Ulang Kapsul"
            className="rounded-2xl border border-white/15 bg-slate-950/75 p-2.5 text-slate-300 backdrop-blur-md transition hover:bg-white/15 hover:text-white active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={toggleMute}
            title={muted ? 'Nyalakan Suara' : 'Bisukan Suara'}
            className="rounded-2xl border border-white/15 bg-slate-950/75 p-2.5 text-slate-300 backdrop-blur-md transition hover:bg-white/15 hover:text-white active:scale-95"
          >
            {muted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Camera Hint */}
      <div className="pointer-events-none fixed bottom-4 left-4 z-10 hidden rounded-xl border border-white/10 bg-slate-950/60 px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur-md md:block">
        Drag layar untuk putar kamera • Scroll untuk zoom
      </div>

      {/* Bottom Arcade Controls (D-Pad + Drop Button) */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex items-end justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-5 rounded-3xl border border-white/15 bg-slate-950/80 px-5 py-3 shadow-2xl backdrop-blur-md">
          {/* D-Pad */}
          <div className="grid grid-cols-3 gap-1.5">
            <div />
            <button
              onPointerDown={() => handlePadPress(0, -1)}
              onPointerUp={handlePadRelease}
              onPointerLeave={handlePadRelease}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-cyan-500/30 active:scale-90"
              aria-label="Maju"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <div />

            <button
              onPointerDown={() => handlePadPress(-1, 0)}
              onPointerUp={handlePadRelease}
              onPointerLeave={handlePadRelease}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-cyan-500/30 active:scale-90"
              aria-label="Kiri"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onPointerDown={() => handlePadPress(0, 1)}
              onPointerUp={handlePadRelease}
              onPointerLeave={handlePadRelease}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-cyan-500/30 active:scale-90"
              aria-label="Mundur"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              onPointerDown={() => handlePadPress(1, 0)}
              onPointerUp={handlePadRelease}
              onPointerLeave={handlePadRelease}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-cyan-500/30 active:scale-90"
              aria-label="Kanan"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Drop / Grab Button */}
          <button
            onClick={triggerDrop}
            disabled={clawPhase !== 'idle' || coins <= 0}
            className="font-display flex h-16 min-w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 px-6 text-lg font-bold tracking-wider text-white shadow-lg shadow-pink-500/35 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {clawPhase === 'idle' ? 'CAPIT!' : 'PROSES...'}
          </button>
        </div>
      </div>

      {/* Capsule Reveal Modal */}
      <CapsuleRevealModal capsule={pendingReveal} onClose={() => setPendingReveal(null)} />

      {/* Collection Drawer */}
      <CollectionDrawer
        open={drawerOpen}
        items={collection}
        totalPoints={totalPoints}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

export default App;
