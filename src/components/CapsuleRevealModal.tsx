import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { TIER_CONFIG, type CapsuleEntity, type CollectibleItem } from '../data/collectibles';
import { soundEngine } from '../utils/sound';
import { CollectibleArtwork } from './CollectibleArtwork';

interface CapsuleRevealModalProps {
  capsule: CapsuleEntity | null;
  prize: CollectibleItem | null;
  onClose: () => void;
}

export function CapsuleRevealModal({ capsule, prize, onClose }: CapsuleRevealModalProps) {
  const [opened, setOpened] = useState(false);

  if (!capsule || !prize) return null;

  const cfg = TIER_CONFIG[prize.tier];

  const handleOpen = () => {
    if (opened) return;
    setOpened(true);
    soundEngine.playReveal(prize.tier);
  };

  const handleClose = () => {
    setOpened(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 p-6 text-center shadow-2xl"
        style={{ boxShadow: `0 0 60px ${cfg.glow}` }}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-slate-300 transition hover:bg-white/20 hover:text-white"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        {!opened ? (
          <div className="flex flex-col items-center py-4">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" /> Kapsul Berhasil Didapat!
            </span>

            <h2 className="font-display mt-2 text-2xl font-bold text-white">
              Siap Membuka Hadiah?
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Klik kapsul di bawah untuk melihat isi di dalamnya.
            </p>

            <button
              onClick={handleOpen}
              className="animate-capsule-wobble group relative my-8 flex h-36 w-36 cursor-pointer flex-col items-center justify-center focus:outline-none"
            >
              <div
                className="absolute inset-0 rounded-full blur-2xl transition-opacity group-hover:opacity-100"
                style={{ backgroundColor: cfg.glow, opacity: 0.7 }}
              />
              <div
                className="relative h-16 w-32 rounded-t-full border-2 border-white/30 shadow-inner"
                style={{
                  background: `radial-gradient(circle at 35% 30%, #ffffff88, ${capsule.shellColor})`,
                }}
              />
              <div className="relative z-10 h-2.5 w-34 rounded-full border border-white/40 bg-white/90 shadow-md" />
              <div
                className="relative h-16 w-32 rounded-b-full border-2 border-white/30"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, #ffffff, #cbd5e1)',
                }}
              />
            </button>

            <button
              onClick={handleOpen}
              className="font-display w-full rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 px-6 py-3.5 text-lg font-bold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110 active:scale-95"
            >
              BUKA KAPSUL!
            </button>
          </div>
        ) : (
          <div className="animate-pop-in flex flex-col items-center py-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${cfg.badgeClass}`}
            >
              <Sparkles className="h-3.5 w-3.5" /> {cfg.label} • {cfg.frameName}
            </span>

            <div className="animate-float-slow my-6">
              <CollectibleArtwork item={prize} size="lg" />
            </div>

            <h2 className="font-display text-2xl font-bold text-white">{prize.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{prize.description}</p>

            {prize.points > 0 && (
              <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-300">
                +{prize.points} Poin Koleksi
              </div>
            )}

            <button
              onClick={handleClose}
              className="font-display mt-6 w-full rounded-2xl bg-white px-6 py-3 text-base font-bold text-slate-900 transition hover:bg-slate-200 active:scale-95"
            >
              {prize.kind === 'zonk' ? 'Coba Lagi' : 'Simpan ke Album'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
