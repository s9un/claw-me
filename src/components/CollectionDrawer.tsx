import { Trophy, X } from 'lucide-react';
import { RARITY_CONFIG, type CollectedPrize } from '../data/prizes';

interface CollectionDrawerProps {
  open: boolean;
  items: CollectedPrize[];
  totalPoints: number;
  onClose: () => void;
}

export function CollectionDrawer({ open, items, totalPoints, onClose }: CollectionDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-white/15 bg-slate-950/95 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Koleksi Hadiah</h2>
              <p className="text-xs text-slate-400">
                {items.length} hadiah • {totalPoints.toLocaleString()} poin
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white"
            aria-label="Tutup koleksi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-6 text-center">
              <span className="text-4xl">🎁</span>
              <p className="mt-3 text-sm font-medium text-slate-300">Belum ada hadiah</p>
              <p className="mt-1 text-xs text-slate-500">
                Gerakkan capit dan jatuhkan kapsul ke Drop Zone untuk membuka hadiah pertamamu!
              </p>
            </div>
          ) : (
            items.map((item) => {
              const cfg = RARITY_CONFIG[item.rarity];
              return (
                <div
                  key={item.uid}
                  className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-3xl">
                    {item.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-white">{item.name}</h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${cfg.badgeBg}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                      {item.description}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-amber-300">+{item.points} pts</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
