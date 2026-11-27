import { useMemo, useState } from 'react';
import { Gift, Sparkles, Trophy, X } from 'lucide-react';
import {
  CAPIT_LETTERS,
  getCollectiblesBySeries,
  SERIES_LIST,
  TIER_CONFIG,
  type OwnedCollectibleMeta,
  type Tier,
} from '../data/collectibles';
import { CollectibleArtwork } from './CollectibleArtwork';

interface AlbumModalProps {
  open: boolean;
  activeSeriesId: string;
  ownedItems: Record<string, OwnedCollectibleMeta>; // key: `${seriesId}:${collectibleId}`
  isLoggedIn: boolean;
  onRedeemCapit: (seriesId: string) => Promise<void>;
  onClose: () => void;
}

export function AlbumModal({
  open,
  activeSeriesId,
  ownedItems,
  isLoggedIn,
  onRedeemCapit,
  onClose,
}: AlbumModalProps) {
  const [selectedSeries, setSelectedSeries] = useState(activeSeriesId);
  const [tierFilter, setTierFilter] = useState<'ALL' | 'B' | 'A' | 'SS' | 'SSR'>('ALL');
  const [redeeming, setRedeeming] = useState(false);

  const allItems = useMemo(() => getCollectiblesBySeries(selectedSeries), [selectedSeries]);
  const animalItems = useMemo(() => allItems.filter((i) => i.kind === 'animal'), [allItems]);

  const filteredAnimals = useMemo(() => {
    if (tierFilter === 'ALL') return animalItems;
    return animalItems.filter((i) => i.tier === tierFilter);
  }, [animalItems, tierFilter]);

  const unlockedCount = useMemo(
    () =>
      animalItems.filter((i) => (ownedItems[`${selectedSeries}:${i.id}`]?.quantity ?? 0) > 0)
        .length,
    [animalItems, ownedItems, selectedSeries]
  );

  const canRedeemCapit = CAPIT_LETTERS.every(
    (ltr) => (ownedItems[`${selectedSeries}:letter-${ltr}`]?.quantity ?? 0) >= 1
  );

  if (!open) return null;

  const handleRedeem = async () => {
    if (!canRedeemCapit || redeeming) return;
    setRedeeming(true);
    await onRedeemCapit(selectedSeries);
    setRedeeming(false);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-950/95 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white">Album Koleksi & Inventori</h2>
              <p className="text-xs text-slate-400">
                Terbuka: <strong className="text-white">{unlockedCount}</strong> / {animalItems.length} Collectibles ME
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSeries}
              onChange={(e) => setSelectedSeries(e.target.value)}
              className="rounded-xl border border-white/15 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
            >
              {SERIES_LIST.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.badge})
                </option>
              ))}
            </select>

            <button
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white"
              aria-label="Tutup album"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CAPIT Letter Redemption Bar */}
        <div className="border-b border-white/10 bg-slate-900/60 px-6 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" /> Tukar Huruf CAPIT → +5 CCoin Free
              </p>
              <p className="text-[11px] text-slate-400">
                Kumpulkan minimal 1x untuk setiap huruf C-A-P-I-T dari Tier C.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {CAPIT_LETTERS.map((ltr) => {
                const qty = ownedItems[`${selectedSeries}:letter-${ltr}`]?.quantity ?? 0;
                return (
                  <div
                    key={ltr}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl border text-base font-extrabold ${
                      qty > 0
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                        : 'border-white/10 bg-slate-950 text-slate-600'
                    }`}
                  >
                    {ltr}
                    {qty > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 rounded-full bg-cyan-400 px-1.5 text-[10px] font-bold text-slate-950">
                        {qty}
                      </span>
                    )}
                  </div>
                );
              })}

              <button
                onClick={handleRedeem}
                disabled={!canRedeemCapit || redeeming || !isLoggedIn}
                className="ml-2 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Gift className="h-3.5 w-3.5" />
                {redeeming ? 'Menukar...' : 'Tukar 5 CCoin'}
              </button>
            </div>
          </div>
        </div>

        {/* Tier Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-6 py-3">
          {(['ALL', 'B', 'A', 'SS', 'SSR'] as const).map((tier) => {
            const label =
              tier === 'ALL'
                ? `Semua (${animalItems.length})`
                : `${TIER_CONFIG[tier as Tier].label} • ${TIER_CONFIG[tier as Tier].frameName}`;
            const active = tierFilter === tier;
            return (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-white text-slate-950'
                    : 'bg-white/5 text-slate-300 hover:bg-white/15'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Grid of Collectibles ME (Revealed vs Silhouette) */}
        <div className="flex-1 overflow-y-auto p-6">
          {animalItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <p className="text-lg font-semibold text-white">Seri Ini Akan Hadir Bulan Depan!</p>
              <p className="mt-1 text-xs">Pilih seri "First Edition" untuk melihat koleksi saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {filteredAnimals.map((item) => {
                const meta = ownedItems[`${selectedSeries}:${item.id}`];
                const qty = meta?.quantity ?? 0;
                const unlocked = qty > 0;
                const cfg = TIER_CONFIG[item.tier];

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col items-center rounded-2xl border p-3 text-center transition ${
                      unlocked
                        ? 'border-white/15 bg-white/5'
                        : 'border-white/5 bg-slate-900/50 opacity-75'
                    }`}
                  >
                    <div className="relative">
                      <CollectibleArtwork item={item} silhouette={!unlocked} size="md" />
                      {unlocked && qty > 1 && (
                        <span className="absolute -right-2 -top-2 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-950 shadow">
                          x{qty}
                        </span>
                      )}
                    </div>

                    <span
                      className={`mt-2.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${cfg.badgeClass}`}
                    >
                      {item.tier}
                    </span>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-white">
                      {unlocked ? item.name : '???'}
                    </p>

                    {unlocked && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        {meta.tradeQuantity > 0 && meta.capitQuantity === 0
                          ? `Trade${meta.tradedFromUsernames[0] ? ` @${meta.tradedFromUsernames[0]}` : ''}`
                          : meta.tradeQuantity > 0
                            ? `Capit ${meta.capitQuantity} • Trade ${meta.tradeQuantity}`
                            : 'Hasil Capit'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
