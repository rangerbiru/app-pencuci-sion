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
| `API_URL` | alamat server Laravel **tanpa** `/api/v1` (aplikasi menambahkannya) |
| `EXPO_OWNER`, `EXPO_PROJECT_ID` | akun dan project EAS Anda |

### Uji di HP fisik dengan Laravel di laptop

1. Sambungkan HP dan laptop ke Wi-Fi yang sama.
2. Cari IP laptop (Linux: `ip addr`, macOS: `ipconfig getifaddr en0`, Windows: `ipconfig`), mis. `192.168.1.10`.
3. Jalankan Laravel agar bisa diakses dari jaringan:
   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```
4. Isi `API_URL=http://192.168.1.10:8000` di `.env.dev`.
5. Jalankan `npm run dev`, lalu scan QR dengan Expo Go atau development build.

Untuk server hosting pakai URL https, mis. `API_URL=https://sion.contoh.id`.

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
menyembunyikan tab, kartu Beranda, dan tombolnya. `preparation` (penyiapan batch) sengaja mati
karena API belum menyediakan daftar item untuk hasil penyiapan.

## Logo

Berkas logo di `assets/images/` masih raster beresolusi rendah dari web. Ganti berkasnya dengan nama
yang sama (`icon-1024.png`, `adaptive-icon-foreground.png`, `splash.png`, `emblem.png`,
`logo-full.png`, `wordmark.png`) saat file final dari klien tersedia; kode tidak perlu diubah.
