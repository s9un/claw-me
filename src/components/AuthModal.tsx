import { useState } from 'react';
import { LogIn, X } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl"
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/25 to-cyan-500/25 text-cyan-300">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="font-display mt-3 text-2xl font-bold text-white">Masuk ke CAPIT</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Simpan koleksi hadiah, koin, dan poin Anda secara otomatis di cloud agar bisa diakses
            dari perangkat mana saja.
          </p>
        </div>

        {!isSupabaseConfigured ? (
          <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-left text-xs leading-relaxed text-amber-200">
            <p className="font-semibold">Supabase belum dikonfigurasi</p>
            <p className="mt-1 text-amber-200/80">
              Tambahkan <code className="rounded bg-black/30 px-1">VITE_SUPABASE_URL</code> dan{' '}
              <code className="rounded bg-black/30 px-1">VITE_SUPABASE_ANON_KEY</code> pada file{' '}
              <code className="rounded bg-black/30 px-1">.env</code> atau GitHub Secrets untuk
              mengaktifkan login Google.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow transition hover:bg-slate-100 active:scale-95 disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              {loading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}
            </button>

            {errorMsg && (
              <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-center text-xs text-rose-300">
                {errorMsg}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
