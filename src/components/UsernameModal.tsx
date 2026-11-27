import { useState } from 'react';
import { UserCheck } from 'lucide-react';

interface UsernameModalProps {
  open: boolean;
  onSave: (username: string) => Promise<string | null>;
}

export function UsernameModal({ open, onSave }: UsernameModalProps) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleChange = (raw: string) => {
    // Force lowercase and strip any non-alphanumeric characters (no spaces/punctuation)
    const sanitized = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    setValue(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!/^[a-z0-9]{3,20}$/.test(cleaned)) {
      setError('Username harus 3–20 karakter (hanya huruf kecil a-z dan angka 0-9).');
      return;
    }

    setError(null);
    setSaving(true);
    const err = await onSave(cleaned);
    setSaving(false);
    if (err) {
      setError(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300">
            <UserCheck className="h-6 w-6" />
          </div>
          <h2 className="font-display mt-3 text-xl font-bold text-white">Buat Username Baru</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Gunakan huruf kecil &amp; angka saja (3–20 karakter, tanpa spasi atau tanda baca).{' '}
            <strong className="text-amber-300">
              Username bersifat permanen dan tidak dapat diubah setelah disimpan.
            </strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="contoh: capitmaster99"
            maxLength={20}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            className="w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-3 text-sm lowercase text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
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
