import { useState } from 'react';
import { UserCheck, X } from 'lucide-react';

interface UsernameModalProps {
  open: boolean;
  required: boolean;
  currentUsername: string | null;
  onSave: (username: string) => Promise<string | null>;
  onClose: () => void;
}

export function UsernameModal({
  open,
  required,
  currentUsername,
  onSave,
  onClose,
}: UsernameModalProps) {
  const [value, setValue] = useState(currentUsername ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = value.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleaned)) {
      setError('Username harus 3–20 karakter (hanya huruf, angka, dan underscore _).');
      return;
    }

    setError(null);
    setSaving(true);
    const err = await onSave(cleaned);
    setSaving(false);
    if (err) {
      setError(err);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl">
        {!required && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-slate-300 transition hover:bg-white/20 hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300">
            <UserCheck className="h-6 w-6" />
          </div>
          <h2 className="font-display mt-3 text-xl font-bold text-white">
            {required ? 'Buat Username Baru' : 'Ubah Username'}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {required
              ? 'Login pertama berhasil! Buat username unik untuk menyimpan koleksi & menerima top-up Saweria.'
              : 'Masukkan username baru Anda (3–20 karakter, huruf/angka/_).'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="contoh: claw_master99"
            maxLength={20}
            autoFocus
            className="w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />

          {error && (
            <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="font-display w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan Username'}
          </button>
        </form>
      </div>
    </div>
  );
}
