import { Flame, Sparkles } from 'lucide-react';

interface PityBonusModalProps {
  open: boolean;
  onClose: () => void;
}

export function PityBonusModal({ open, onClose }: PityBonusModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="animate-pop-in relative w-full max-w-sm rounded-3xl border border-amber-300/40 bg-gradient-to-b from-amber-950/90 to-slate-950/95 p-6 text-center shadow-[0_0_60px_rgba(251,191,36,0.4)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
          <Flame className="h-9 w-9 animate-pulse" />
        </div>

        <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-400/15 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-200">
          <Sparkles className="h-3 w-3" /> Pity System Aktif!
        </span>

        <h2 className="font-display mt-2 text-2xl font-bold text-white">
          Bonus Drop Rate 90%!
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Karena kamu sudah 10x gagal berturut-turut, peluang berhasil mencapit berbalik menjadi{' '}
          <strong className="text-amber-300">90% DAPAT</strong> untuk{' '}
          <strong className="text-white">1x main berikutnya</strong>!
        </p>

        <button
          onClick={onClose}
          className="font-display mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-base font-bold text-slate-950 shadow-lg transition hover:brightness-110 active:scale-95"
        >
          Gas Capit Sekarang!
        </button>
      </div>
    </div>
  );
}
