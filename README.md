# SION Mobile

Aplikasi Android (lalu iOS) untuk Pencuci, Kepala Pencuci, dan Mandor SION-WMS. Expo SDK 54,
React Native 0.81, Expo Router, Redux Toolkit + RTK Query. Web hanya untuk pratinjau desain.

Dokumen penting:

- `docs/API_MOBILE.md` kontrak API
- `docs/DESIGN_MOBILE.md` token, prinsip, wireframe, dan hasil swa-kritik
- `docs/screenshots/` tangkapan layar 360 x 800 dan 412 x 915

## Menyiapkan .env.dev

```bash
cp .env.dev.example .env.dev
```

| Kunci | Isi |
|---|---|
| `ENV` | `development` |
| `API_URL` | alamat API lengkap, mis. `http://127.0.0.1:8000/api/v1` (tanpa akhiran pun diterima; aplikasi menambahkan `/api/v1`) |
| `EXPO_OWNER`, `EXPO_PROJECT_ID` | akun dan project EAS Anda |

### Uji di HP fisik dengan Laravel di laptop

1. Sambungkan HP dan laptop ke Wi-Fi yang sama.
2. Cari IP laptop (Linux: `ip addr`, macOS: `ipconfig getifaddr en0`, Windows: `ipconfig`), mis. `192.168.1.10`.
3. Jalankan Laravel dengan database demo agar bisa diakses dari jaringan:
   ```bash
   DB_DATABASE=sion_wms_mobile php artisan serve --host=0.0.0.0 --port=8000
   ```
4. Isi `API_URL=http://192.168.1.10:8000/api/v1` di `.env.dev` (pratinjau web cukup
   `http://127.0.0.1:8000/api/v1`). Akun demo ada di `testing.md` repo Laravel.
5. Jalankan `npm run dev`, lalu scan QR dengan Expo Go atau development build.

`.env.prod` memakai server hosting (`https://floralwhite-barracuda-635556.hostingersite.com/api/v1`),
dipakai setelah server diperbarui ke Tahap 15B dan 15C.

## Perintah

| Perintah | Guna |
|---|---|
| `npm run dev` | server pengembangan (cache dibersihkan) |
| `npm run dev:android` | langsung buka di emulator/HP Android |
| `npm run lint`, `npm run format` | ESLint dan Prettier |
| `npm run test` | Jest + Testing Library |

## Build APK untuk dibagikan

Profil `preview` di `eas.json` menghasilkan APK (distribusi internal):

```bash
# di cloud EAS
npx eas build --profile preview --platform android
# atau di laptop sendiri (butuh Android SDK + JDK 17)
npx eas build --profile preview --platform android --local
```

`production` menghasilkan Android App Bundle (Play Store) dan build iOS untuk perangkat.
Paket: `id.sion.mobile` (production), `id.sion.mobile.dev` (development/preview).

## Modul fitur

Daftar modul ada di `utils/config.ts` (`allFeatures`). Menghapus satu modul dari `enabledFeatures`
menyembunyikan tab, kartu Beranda, dan tombolnya. Sejak Tahap 15C semua modul aktif.

`flags.kepalaWashing` (bawaan `false`) menyembunyikan ambil bahan, serah hasil, kerja ulang, dan
Riwayat untuk Kepala Pencuci sampai klien memutuskan siapa yang menyetujui pengajuan Kepala dan
bagaimana upahnya. Kepala tetap punya Tim, Verifikasi, Progres bonus tim, Pendapatan, dan Profil.

## Tampilan

Profil/Akun > Tampilan: Terang (bawaan), Gelap, atau Ikuti sistem. Disimpan di AsyncStorage dan
berlaku langsung. Semua warna dari `theme/tokens.json`; `theme/contrast.test.ts` memeriksa
kontras AA kedua mode.

## Kirim ulang

Aksi lapangan (absen, ambil bahan, serah hasil, kerja ulang, konfirmasi timbang, terima batch)
lewat antrean offline. Semua POST/PUT membawa `Idempotency-Key`; kiriman ulang aksi yang sama
memakai key yang sama sehingga server tidak menjalankannya dua kali.

## Logo

Berkas logo di `assets/images/` masih raster beresolusi rendah dari web. Ganti berkasnya dengan nama
yang sama (`icon-1024.png`, `adaptive-icon-foreground.png`, `splash.png`, `emblem.png`,
`logo-full.png`, `wordmark.png`) saat file final dari klien tersedia; kode tidak perlu diubah.
