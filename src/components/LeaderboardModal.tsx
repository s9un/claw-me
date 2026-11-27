import { useEffect, useState } from 'react';
import { Crown, X } from 'lucide-react';
import { SERIES_LIST } from '../data/collectibles';
import { supabase } from '../lib/supabase';

interface LeaderboardRow {
  username: string;
  unlocked_count: number;
  ssr_count: number;
  ss_count: number;
  a_count: number;
  b_count: number;
}

interface LeaderboardModalProps {
  open: boolean;
  activeSeriesId: string;
  currentUsername: string | null;
  onClose: () => void;
}

export function LeaderboardModal({
  open,
  activeSeriesId,
  currentUsername,
  onClose,
}: LeaderboardModalProps) {
  const [selectedSeries, setSelectedSeries] = useState(activeSeriesId);
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);

  useEffect(() => {
    if (!open || !supabase) return;
    let active = true;
    supabase
      .rpc('get_leaderboard', { target_series: selectedSeries })
      .then(({ data }) => {
        if (!active) return;
        setRows((data as LeaderboardRow[]) ?? []);
      });
    return () => {
      active = false;
    };
  }, [open, selectedSeries]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-950/95 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Leaderboard Kolektor</h2>
              <p className="text-[11px] text-slate-400">
                Peringkat berdasarkan Collectibles ME unik terbuka
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white"
            aria-label="Tutup leaderboard"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-white/10 px-5 py-2.5">
          <select
            value={selectedSeries}
            onChange={(e) => {
              setRows(null);
              setSelectedSeries(e.target.value);
            }}
            className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
          >
            {SERIES_LIST.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.badge})
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-5">
          {rows === null ? (
            <p className="py-12 text-center text-xs text-slate-400">Memuat peringkat...</p>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-xs text-slate-400">
              Belum ada pemain di leaderboard untuk seri ini.
            </p>
          ) : (
            rows.map((row, index) => {
              const isMe = currentUsername && row.username === currentUsername;
              return (
                <div
                  key={row.username}
                  className={`flex items-center justify-between rounded-2xl border px-3.5 py-2.5 ${
                    isMe
                      ? 'border-cyan-400/50 bg-cyan-500/15'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-display flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                        index === 0
                          ? 'bg-yellow-400 text-slate-950'
                          : index === 1
                            ? 'bg-slate-300 text-slate-950'
                            : index === 2
                              ? 'bg-amber-600 text-white'
                              : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">@{row.username}</p>
                      <p className="text-[10px] text-slate-400">
                        SSR {row.ssr_count} • SS {row.ss_count} • A {row.a_count} • B {row.b_count}
                      </p>
                    </div>
                  </div>

                  <span className="font-display text-sm font-bold text-amber-300">
                    {row.unlocked_count}/90
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
