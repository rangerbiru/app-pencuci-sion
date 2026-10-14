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

## Menjalankan dengan Laravel lokal (web dan HP), urutan persis

`npm run dev:lan` mendeteksi IP LAN laptop setiap kali dijalankan dan memakai
`API_URL=http://<IP>:8000/api/v1` untuk sesi itu saja (`.env.dev` tidak diubah). Jadi IP yang berubah
setelah Wi-Fi tersambung ulang tidak perlu diketik ulang di mana pun.

1. Sambungkan laptop dan HP ke Wi-Fi yang sama. Pastikan tidak ada Metro lain di port 8081
   (`ss -ltnp | grep 8081` kosong); bila terpakai, Expo pindah ke 8082 dan origin itu tidak ada
   di CORS.
2. Lihat IP, `API_URL`, dan perintah Laravel yang sudah berisi IP itu:
   ```bash
   npm run dev:lan:info
   ```
   Contoh keluaran:
   ```
   IP LAN      10.78.124.18 (wlp4s0), dari rute bawaan
   API_URL     http://10.78.124.18:8000/api/v1
   Cek /meta   koneksi ditolak (connection refused): Laravel belum jalan di port ini
   Laravel (terminal lain, di repo web-gudang):
     DB_DATABASE=sion_wms_mobile CORS_ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081,http://10.78.124.18:8081 PHP_CLI_SERVER_WORKERS=4 php artisan serve --host=0.0.0.0 --port=8000 --no-reload
   ```
3. Terminal 1, di repo **web-gudang**: hentikan `artisan serve` lama (Ctrl+C), lalu salin perintah
   Laravel dari langkah 2 apa adanya:
   ```bash
   DB_DATABASE=sion_wms_mobile \
   CORS_ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081,http://<IP>:8081 \
   PHP_CLI_SERVER_WORKERS=4 php artisan serve --host=0.0.0.0 --port=8000 --no-reload
   ```
   - `--host=0.0.0.0` supaya HP bisa menjangkau laptop (bawaan 127.0.0.1 hanya dari laptop).
   - `DB_DATABASE` dan `CORS_ALLOWED_ORIGINS` di depan perintah berlaku untuk proses ini saja dan
     menang atas `.env` repo web; `.env` repo web tidak perlu diubah.
   - `PHP_CLI_SERVER_WORKERS=4` + `--no-reload`: beberapa permintaan dilayani sekaligus (tanpa ini
     pratinjau web lambat karena permintaan antre). Akibatnya perubahan `.env` web baru terbaca
     setelah Laravel dijalankan ulang.
4. Terminal 2, di repo ini:
   ```bash
   npm run dev:lan        # HP (Expo Go) dan web; tekan w untuk web
   npm run dev:lan:web    # langsung membuka pratinjau web
   ```
   Di awal terminal tampil IP, `API_URL`, dan hasil "Cek /meta". Harus `OK`; bila belum, Laravel
   langkah 3 belum jalan atau IP-nya beda. QR Expo Go memakai IP yang sama.
5. Web: `http://localhost:8081`. HP: scan QR dengan Expo Go. Masuk dengan akun demo
   (`testing.md` repo Laravel).

Bila gagal terhubung di build pengembangan, pesan di layar menyebut alamat yang dicoba dan
penyebabnya:

| Penyebab di layar | Artinya | Perbaikan |
|---|---|---|
| koneksi ditolak (connection refused) | tidak ada server di IP:port itu | jalankan langkah 3; IP berubah: ulangi langkah 2 s.d. 4 |
| CORS, origin ... tidak ada di CORS_ALLOWED_ORIGINS | Laravel hidup, tetapi menolak origin pratinjau web | jalankan ulang Laravel dengan `CORS_ALLOWED_ORIGINS` dari langkah 2 (port Metro harus sama) |
| timeout, tidak ada jawaban dalam n detik | permintaan tidak sampai | IP lama, firewall laptop (izinkan port 8000), atau HP di Wi-Fi lain |
| koneksi ditolak atau alamat tidak terjangkau (HP) | HP tidak bisa mencapai laptop | Laravel harus `--host=0.0.0.0`, HP dan laptop di Wi-Fi yang sama |
| 127.0.0.1/localhost menunjuk ke HP sendiri | `API_URL` masih 127.0.0.1 | pakai `npm run dev:lan`, bukan `npm run dev` |

Pilihan: `LAN_IP=192.168.1.5 npm run dev:lan` memaksa IP (mis. ada VPN), `LARAVEL_PORT=8001`
mengganti port Laravel, argumen lain diteruskan ke Expo (`npm run dev:lan -- --port 8082`; origin
CORS di keluaran ikut berubah).

`npm run dev` tetap ada dan memakai `API_URL` dari `.env.dev` apa adanya (mis. server lain).
`.env.prod` memakai server hosting (`https://floralwhite-barracuda-635556.hostingersite.com/api/v1`).

## Perintah

| Perintah | Guna |
|---|---|
| `npm run dev:lan`, `npm run dev:lan:web` | Expo dengan `API_URL` = IP LAN laptop terdeteksi (cache dibersihkan) |
| `npm run dev:lan:info` | tampilkan IP, `API_URL`, CORS, dan perintah Laravel |
| `npm run dev` | server pengembangan dengan `API_URL` dari `.env.dev` (cache dibersihkan) |
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
