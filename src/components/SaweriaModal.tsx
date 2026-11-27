import { useState } from 'react';
import { Check, Coins, Copy, ExternalLink, X } from 'lucide-react';

interface SaweriaModalProps {
  open: boolean;
  username: string | null;
  onClose: () => void;
}

const SAWERIA_URL =
  (import.meta.env.VITE_SAWERIA_URL as string | undefined) || 'https://saweria.co';

export function SaweriaModal({ open, username, onClose }: SaweriaModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const noteCode = `CLAW:${username || 'username_anda'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(noteCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-amber-400/30 bg-slate-900/95 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-slate-300 transition hover:bg-white/20 hover:text-white"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
            <Coins className="h-6 w-6" />
          </div>
          <h2 className="font-display mt-3 text-2xl font-bold text-white">Token Main Habis!</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Dapatkan token tambahan melalui <strong className="text-amber-300">Saweria.co</strong>.
            Harga <strong className="text-white">Rp 1.000 = 1 Token Berbayar</strong>.
          </p>
        </div>

        <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-300">
          <p className="font-semibold text-white">Cara Top-up Otomatis:</p>
          <ol className="list-inside list-decimal space-y-1.5 text-slate-400">
            <li>Salin kode pesan di bawah ini.</li>
            <li>Buka Saweria, pilih nominal kelipatan Rp 1.000 (misal Rp 5.000 = 5 token).</li>
            <li>
              Tempel kode pada kolom <strong className="text-slate-200">Pesan / Dukungan</strong>.
            </li>
            <li>Setelah pembayaran sukses, token otomatis masuk ke akun Anda!</li>
          </ol>

          <div className="mt-2 flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2">
            <code className="font-mono text-sm font-bold text-amber-200">{noteCode}</code>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/35"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Disalin' : 'Salin'}
            </button>
          </div>
        </div>

        <div className="mt-5 flex gap-2.5">
          <a
            href={SAWERIA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:brightness-110 active:scale-95"
          >
            <span>Buka Saweria.co</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
