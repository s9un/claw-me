# CAPIT — Game Rules & Project Guide

Game mesin capit 3D web-based (**Vite + React + TypeScript + Three.js / `@react-three/fiber` + `@react-three/rapier` + Tailwind CSS + Supabase**).
Live domain: `https://claw.sgun.name/` (GitHub Pages via `.github/workflows/deploy.yml`).

---

## 24 Game Rules

1. **Percobaan Tamu (Non-Login):** User belum login dapat mencoba permainan sebanyak **3x**, setelah itu diwajibkan login.
2. **Peluang Tamu:** User belum login mendapat chance berhasil mencapit **30%**. Jika mendapatkan hadiah, **hadiah tidak akan disimpan** meskipun dia berhasil mendaftar akun baru.
3. **Username User Login:** User login dapat merubah username mereka sendiri; pada awal login pertama diminta wajib membuat username baru.
4. **Data User Login:** Disimpan `username`, `email`, dan jumlah token koin (`free_tokens` & `paid_tokens`) via Google SSO (Supabase Auth).
5. **Konfigurasi Peluang:** User login memiliki chance mendapatkan hadiah sesuai rarity yang dapat ditentukan di config database (`public.game_config`).
6. **Sistem Token (`CCoin`) & Reset Harian:**
   - **Non-login:** Mendapatkan **3 CCoin Gratis** setiap harinya, reset tiap jam **00:00 AM GMT+7**. User non-login hanya bisa memiliki maksimal 3 token gratis.
   - **Login:** Mendapatkan **+3 CCoin Gratis** tiap harinya (reset 00:00 AM GMT+7), dan dapat **terakumulasi tanpa batas** hanya ketika user login di hari itu.
   - **Pemisahan & Prioritas:** Perhitungan token gratis (`free_tokens`) dan token berbayar (`paid_tokens`) dipisahkan. Penggunaan permainan selalu mengutamakan **CCoin Gratis** dulu sampai habis, baru memakai **CCoin Berbayar**.
7. **Zona Waktu:** Semua perhitungan jam/tanggal menggunakan **GMT+7 (`Asia/Jakarta`)**.
8. **Popup Pembelian Token:** Ketika token main habis, tampilkan popup rekomendasi pembelian token koin melalui `saweria.co`.
9. **Webhook Pembayaran:** Dokumentasi pembayaran transaksi token koin & webhook mengacu pada `https://saweria.co/docs/webhook` (diimplementasikan di `supabase/functions/saweria-webhook/index.ts`).
10. **Harga Token:** **Rp 1.000** per 1 CCoin Berbayar.
11. **Tier Hadiah:** Total ada **5 tier** (`C`, `B`, `A`, `SS`, `SSR`).
12. **Tier C:**
    - `Zonk` (kosong/tidak beruntung) — *tidak* dihitung gagal dalam pity system (dianggap berhasil mendapat kapsul/hadiah).
    - Sticker huruf bertuliskan `C` / `L` / `A` / `W` / `M` / `E` (1 huruf per 1 hadiah).
    - Jika lengkap mengumpulkan `C-L-A-W-M-E`, user dapat menukarkannya dengan **+5 CCoin Gratis** melalui menu Album/Inventori.
13. **Tier B:** 50 gambar **Collectibles ME** lucu berbeda dengan **frame Bronze**.
14. **Tier A:** 25 gambar **Collectibles ME** lucu berbeda dengan **frame Silver**.
15. **Tier SS:** 10 gambar **Collectibles ME** keren futuristik berbeda dengan **frame Gold**.
16. **Tier SSR:** 5 gambar **Collectibles ME** sangar garang keren berbeda dengan **frame Diamond berkilau**.
17. **Kalkulasi Peluang User Login:**
    - Setiap kali mencapit, chance dibagi 2: **10% dapat / 90% tidak dapat** (capit slip/lepas).
    - Saat **dapat**, kalkulasi rarity hadiah: **Tier C `58.9%`**, **Tier B `25%`**, **Tier A `15%`**, **Tier SS `1%`**, **Tier SSR `0.1%`**.
18. **Pity System:** Ketika user gagal mencapit (capit gagal/lepas) **10x berturut-turut**, muncul popup **Bonus Drop Rate** selama 1x main berikutnya di mana chance berbalik menjadi **90% dapat / 10% tidak dapat**.
19. **Album Koleksi:** Menampilkan **Collectibles ME** yang sudah didapat dalam bentuk sticker ter-reveal sesuai frame tier-nya, dan yang belum didapat hanya berupa **siluet**.
20. **Sistem Series:** Hadiah memiliki series (saat ini **First Edition**, bulan depan **Neon Cyber**).
21. **Pilih Series:** Sebelum mencapit, user dapat memilih series mana yang ingin dimainkan.
22. **Tampilan `[CCoin]`:** Token gratis/free berwarna **biru**, token berbayar/paid berwarna **kuning**, keduanya bernama **CCoin** dan selalu ditampilkan bersamaan **atas–bawah** (atas: free, bawah: paid).
23. **Penamaan Hadiah:** Selalu gunakan istilah **Collectibles ME** (jangan gunakan kata *hewan*).
24. **Skalabilitas Mode:** Arsitektur mendukung penambahan mode permainan baru di masa depan (`src/data/gameModes.ts`).
25. **Optimasi Mobile:** Permainan dioptimalkan untuk penggunaan di layar browser handphone (`100dvh`, kamera responsif, dan kontrol sentuh `touch-none`).

---

## Struktur File Penting

- `src/App.tsx` — State utama game, HUD `CCoin`, kontrol D-Pad & keyboard, integrasi Auth/Pity/Album.
- `src/components/ClawMachineScene.tsx` & `ClawRig.tsx` — Mesin capit 3D, fisika Rapier, mekanik slip capit.
- `src/data/collectibles.ts` & `src/components/CollectibleArtwork.tsx` — 90+ Collectibles ME, huruf CLAWME, Zonk, dan frame tier.
- `src/data/gameModes.ts` — Konfigurasi mode permainan (scalable).
- `src/components/AlbumModal.tsx` — Album koleksi siluet, filter series/tier, penukaran `CLAWME`.
- `src/components/AuthModal.tsx`, `UsernameModal.tsx`, `SaweriaModal.tsx`, `PityBonusModal.tsx`, `CapsuleRevealModal.tsx` — Seluruh modal alur game.
- `supabase/schema.sql` — Tabel PostgreSQL, RLS, trigger user baru, & RPC (`claim_daily_tokens`, `set_username`, `redeem_clawme`).
- `supabase/functions/saweria-webhook/index.ts` — Edge Function penerima webhook Saweria.
- `supabase/chc.env.example` — Contoh konfigurasi drop rate & Saweria stream key.

---

## Checklist Setup Lanjutan (Untuk Dilanjutkan di Rumah)

1. Jalankan `supabase/schema.sql` di **Supabase Dashboard → SQL Editor**.
2. Aktifkan **Google OAuth** & **Facebook OAuth** di **Supabase → Authentication → Providers**, dan set Redirect URL `https://claw.sgun.name/**` + `http://localhost:5173/**`.
3. Isi **GitHub Repository Secrets** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan opsional `VITE_SAWERIA_URL`).
4. Deploy `supabase/functions/saweria-webhook` ke Supabase Edge Functions & pasang URL-nya di dashboard Webhook Saweria.
5. *(Opsional)* Ganti artwork sticker di `CollectibleArtwork.tsx` dengan ilustrasi `.webp` custom jika aset gambar sudah siap.
