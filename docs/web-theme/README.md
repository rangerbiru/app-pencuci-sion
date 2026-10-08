# Identitas Visual SION untuk Aplikasi Mobile

Paket ini menyalin identitas visual web SION-WMS supaya aplikasi mobile (React Native/Expo) terlihat sama. Semua nilai diambil dari kode web: `resources/css/app.css` (`@theme`), komponen Blade (`x-ui.badge`, `x-common.component-card`, `x-ui.button`, `x-ui.input`), `app/Support/StatusLabels.php`, `Rupiah.php`, dan `Gram.php`. Nilai yang sama dalam bentuk JSON ada di `tokens.json`.

| Isi | Keterangan |
|---|---|
| `tokens.json` | Warna terang dan gelap, huruf, ukuran, radius, jarak, bayangan, badge, semua status, format angka |
| `logo/` | Logo, emblem, wordmark, ikon aplikasi, adaptive icon Android, splash |
| `GLOSARIUM.md` | Salinan `docs/GLOSARIUM.md` (istilah dan definisinya) |
| `referensi/` | Tangkapan layar web: masuk, Beranda, daftar Hasil Sortir, Beranda di HP 390 px |

## Warna merek

Token didefinisikan di `@theme` (`--color-*`). Kolom "Kelas web" menunjukkan kelas yang benar-benar dipakai di layar.

| Peran | Token | Hex | Kelas web |
|---|---|---|---|
| Biru tua utama (navy) | `primary-500` | `#1E3A5F` | warna dasar merek |
| Sidebar dan header | `primary-600` | `#16293F` | `bg-primary-600` |
| Menu aktif, sidebar mode gelap | `primary-700` | `#101E2E` | `bg-primary-700` |
| Aksen emas (tombol utama, fokus, menu aktif) | `gold-500` | `#C9A24B` | `bg-gold-500 text-primary-700` |
| Emas ditekan | `gold-600` | `#A8842F` | `hover:bg-gold-600` |
| Hijau (sukses) | `accent-500` / `accent-600` | `#3E7A4A` / `#2E5C38` | badge `accent` |
| Bahaya | `danger` | `#B3413A` | `text-danger` |
| Latar halaman (krem) | `base-bg` | `#F7F5F0` | `bg-base-bg` |
| Permukaan kartu | `base-surface` | `#FFFFFF` | kartu memakai `bg-white` |

Skala lengkap:

| Skala | 50 | 100 | 300 | 500 | 600 | 700 | 900 |
|---|---|---|---|---|---|---|---|
| primary | `#EEF2F7` | `#D4DEEA` | `#9FB6CC` | `#1E3A5F` | `#16293F` | `#101E2E` | `#0B1420` |
| gold | `#FBF6E9` | `#F2E4B8` | `#E3C87A` | `#C9A24B` | `#A8842F` | tidak ada | `#4A3814` |
| accent | `#EEF5EE` | `#CBE3CC` | `#8FC49A` | `#3E7A4A` | `#2E5C38` | tidak ada | `#173A1F` |

Token teks `ink-primary` `#1C2B36`, `ink-secondary` `#5C6B73`, `ink-muted` `#9AA5AC` dan garis `base-border` `#E3DFD5` ada di tema, tetapi hampir tidak dipakai di layar (garis `base-border` dipakai di PDF). Teks, garis, dan latar netral di layar memakai skala abu-abu tema: `gray-200` `#E4E7EC`, `gray-400` `#98A2B3`, `gray-500` `#667085`, `gray-700` `#344054`, `gray-800` `#1D2939`, `gray-900` `#101828`.

### Pemakaian per mode

| Kegunaan | Mode terang | Mode gelap |
|---|---|---|
| Latar halaman | `#F7F5F0` (base-bg) | `#101828` (gray-900) |
| Kartu | `#FFFFFF` | putih 3% di atas latar (`rgba(255,255,255,0.03)`, kira-kira `#171F2E`) |
| Garis kartu dan tabel | `#E4E7EC` (gray-200) | `#1D2939` (gray-800) |
| Sidebar dan header | `#16293F` (primary-600), teks putih, menu tidak aktif putih 70% | `#101E2E` (primary-700) |
| Menu aktif | latar `#101E2E`, teks dan garis kiri 3 px `#C9A24B` | sama |
| Teks utama | `#1D2939` (gray-800) | putih 90% |
| Teks sekunder | `#667085` (gray-500) | `#98A2B3` (gray-400) |
| Tombol utama | latar `#C9A24B`, teks `#101E2E`, ditekan `#A8842F` | sama |
| Tombol sekunder (outline) | latar putih, teks `#344054`, garis `#D0D5DD` | latar `#1D2939`, teks `#98A2B3`, garis `#344054` |
| Sukses | teks `#2E5C38` di `#CBE3CC` | teks `#8FC49A` di `#173A1F` 30% |
| Peringatan | teks `#A8842F` di `#F2E4B8` | teks `#E3C87A` di `#4A3814` 30% |
| Bahaya | teks `#B3413A` di merah sangat muda (Tailwind `red-50`, sekitar `#FEF2F2`) | teks Tailwind `red-300` (sekitar `#FFA2A2`) di `red-900` 30% |
| Info | teks `#16293F` di `#EEF2F7` | teks `#9FB6CC` di `#0B1420` 40% |
| Cincin fokus | `#C9A24B` | `#C9A24B` |

Warna `red-*` adalah warna bawaan Tailwind v4 (didefinisikan dalam oklch); hex di atas adalah padanan terdekatnya.

## Huruf

| Hal | Nilai |
|---|---|
| Nama | Google Sans Flex |
| Sumber | Google Fonts, dimuat lewat `<link>` di `layouts/app.blade.php` dan `layouts/fullscreen-layout.blade.php`. Tidak di-host lokal, jadi folder `fonts/` tidak ada. |
| Ketebalan dimuat | 400 (biasa), 500 (medium: judul kartu, tombol, badge), 700 (bold: tulisan SION, judul besar). Kelas `font-semibold` (600) dipakai di beberapa angka Beranda dan disintesis browser. |
| Cadangan | `ui-sans-serif, system-ui, sans-serif` |
| Angka | Tabular (`tabular-nums`) untuk semua angka gram dan rupiah di tabel dan ringkasan |
| Mobile | Pakai paket `@expo-google-fonts` untuk Google Sans Flex kalau tersedia; kalau belum ada, unduh dari Google Fonts dan muat dengan `expo-font` (lisensinya ikut halaman Google Fonts). |

Skala ukuran (px, tinggi baris):

| Nama | Ukuran | Tinggi baris | Pemakaian |
|---|---|---|---|
| `theme-xs` / `xs` | 12 | 18 / 16 | badge, keterangan kecil, header tabel |
| `theme-sm` / `sm` | 14 | 20 | isi tabel, deskripsi kartu, tombol, input |
| `base` | 16 | 24 | judul kartu |
| `xl` / `theme-xl` | 20 | 28 / 30 | angka ringkasan Beranda, tulisan SION di sidebar |
| `2xl` | 24 | 32 | tulisan SION·WMS di halaman masuk (HP) |
| `3xl` / `title-sm` | 30 | 36 / 38 | tulisan SION·WMS di halaman masuk (desktop) |

## Radius, jarak, bayangan

| Hal | Nilai |
|---|---|
| Radius badge dan avatar | penuh (bulat, 9999) |
| Radius tombol dan input | 8 px (`rounded-lg`) |
| Radius tabel (bingkai) | 12 px (`rounded-xl`) |
| Radius kartu | 16 px (`rounded-2xl`) |
| Satuan jarak | 4 px (Tailwind) |
| Kartu | padding 24 px samping, 20 px atas bawah; jarak antar kartu 24 px |
| Input | tinggi 44 px |
| Tombol | tinggi 48 px (biasa, padding samping 20 px), 44 px (kecil, padding samping 16 px) |
| Badge | huruf 12 px medium, padding 10 px samping, 2 px atas bawah |
| Jarak tepi di HP | 16 px |
| Bayangan kartu | kartu halaman biasa tanpa bayangan, hanya garis 1 px; kartu Beranda `shadow-theme-xs` = `0 1px 2px rgba(16,24,40,0.05)`; tombol utama `shadow-theme-sm` |

## Badge status

Label pendek (1 sampai 2 kata) dan warnanya hanya ditulis di `app/Support/StatusLabels.php`. API mobile mengirim `{code, label}`; tampilkan `label` apa adanya dan pilih warna dari `tokens.json` (`status.<jenis>.<kode>.color`, lalu `badge.colors.<warna>`). Seluruh 62 jenis status (265 nilai) ada di `tokens.json`.

| Label | Jenis (kode) | Warna |
|---|---|---|
| Tertahan | `card_wage.tertahan`, `wage_status.tertahan` | gold |
| Belum Dihitung | `card_wage.belum_dihitung` | neutral |
| Sudah Dihitung | `card_wage.sudah_dihitung` | accent |
| Siap Dibayar | `wage_status.siap` | accent |
| Menunggu | `work_submission.menunggu`, `bonus.pending`, `weighing_confirmation.menunggu`, `cost_accrual_status.pending` | gold |
| Menunggu | `batch.pending` | neutral |
| Menunggu keputusan | `grading_spk.pending` | gold |
| Menunggu Verifikasi | `assignment.pending_verification` | gold |
| Menunggu konfirmasi | tidak ada; konfirmasi hasil timbang yang menunggu berlabel "Menunggu" (`weighing_confirmation.menunggu`) | gold |
| Disetujui | `work_submission.disetujui`, `weighing_confirmation.setuju` | accent |
| Disetujui | `withdrawal.disetujui` | primary |
| Ditolak | `work_submission.ditolak`, `withdrawal.ditolak` | error |
| Tidak Setuju | `weighing_confirmation.tidak_setuju` | error |
| Otomatis | `weighing_confirmation.otomatis` | primary |
| Capai | `bonus.capai` | accent |
| Tidak Dibayar | `bonus.tidak_dibayar` | error |
| Tidak Ada | `bonus.tidak_ada` | neutral |
| Draf | `daily_work.draft`, `nota.draft` | neutral |
| Draf | `grading_session.draft` | gold |
| Kerja Ulang | `daily_work.kerja_ulang` | error |
| Lolos QC | `daily_work.lolos_qc` | gold |
| Terverifikasi | `daily_work.terverifikasi` | accent |
| Standard / Belum Standard | `qc.standard` / `qc.belum_standard` | accent / error |
| Diajukan / Dibayar / Dibatalkan | `withdrawal.*` | gold / accent / neutral |
| Diserahkan / Diterima / Berjalan / Selesai | `batch.*` | gold / primary / primary / accent |
| Belum Diambil / Diambil / Diserahkan / Selesai | `rework.*` | gold / primary / accent / accent |
| Hadir / Telat / Izin / Alpa | `attendance.*` | accent / gold / primary / error |

Warna badge (latar / teks):

| Warna | Mode terang | Mode gelap |
|---|---|---|
| accent (juga success) | `#CBE3CC` / `#2E5C38` | `#173A1F` 30% / `#8FC49A` |
| gold (juga warning) | `#F2E4B8` / `#A8842F` | `#4A3814` 30% / `#E3C87A` |
| primary (juga info) | `#EEF2F7` / `#16293F` | `#0B1420` 40% / `#9FB6CC` |
| error | sekitar `#FEF2F2` / `#B3413A` | merah tua 30% / sekitar `#FFA2A2` |
| neutral | `#F2F4F7` / `#667085` | `#344054` 50% / `#98A2B3` |

## Format angka dan tanggal

Sama dengan web (bahasa Indonesia, zona Asia/Jakarta). API mengirim angka sebagai string desimal (`"1234.50"`) dan waktu ISO 8601 `+07:00`; aplikasi yang memformatnya.

| Hal | Format | Contoh |
|---|---|---|
| Rupiah | `Rp` + spasi, titik ribuan, koma 2 desimal | `Rp 1.234,50` |
| Rupiah minus | minus di depan `Rp` | `-Rp 0,16` |
| Rupiah ringkas (kalimat) | tanpa spasi, tanpa `,00` kalau bulat | `Rp6.450`, `Rp41,05` |
| Rupiah di Beranda | tanpa desimal | `Rp 1.234` |
| Nilai kosong | tanda hubung, bukan nol | `-` |
| Gram di tabel | 2 desimal + ` gr` | `2.000,00 gr` |
| Gram di ringkasan | tanpa desimal kalau bulat | `1.224 gr`, `1.224,50 gr` |
| Pcs | tanpa desimal | `2.144` |
| Persen | 2 desimal | `34,33%` |
| Tanggal | `dd/mm/yyyy` | `07/10/2026` |
| Tanggal dan jam | `dd/mm/yyyy HH:mm` | `07/10/2026 14:30` |
| Tanggal pendek | `dd Bln yyyy` | `07 Okt 2026` |
| Bulan | nama bulan + tahun | `Oktober 2026` |
| Rentang | dengan "s.d." | `07/10/2026 s.d. 10/10/2026` |

## Logo

Sumber logo di repo hanya raster: `public/images/logo/logo.jpeg` (1408 x 768, latar kertas krem bertekstur), `logo.png` (677 x 369, transparan, lebih kecil), dan `logo-crop.jpeg` (558 x 599). Berkas `logo.svg`, `logo-dark.svg`, `logo-icon.svg`, dan `auth-logo.svg` adalah sisa template TailAdmin (kotak biru `#465FFF`), bukan logo SION; jangan dipakai.

Semua berkas di `logo/` dibuat dari `logo.jpeg` (latar kertas dihapus). Bagian logonya hanya sekitar 500 x 540 px, emblemnya sekitar 350 x 360 px, jadi berkas 1024 px adalah hasil perbesaran dan agak lembut. **Perlu file logo resolusi tinggi (SVG atau PNG minimal 2048 px, transparan) dari klien** untuk ikon dan splash final.

| Berkas | Isi |
|---|---|
| `logo-full.png` | Logo lengkap (emblem, tulisan SION, nama dan slogan), 546 x 588, transparan, resolusi asli |
| `emblem.png` | Emblem saja (burung, sarang, perisai, daun), 1024 x 1024 transparan |
| `wordmark.png` | Tulisan "SION" saja, 400 x 118 transparan, resolusi asli (tidak ada versi SVG) |
| `icon-1024.png` | Ikon aplikasi 1024 x 1024, emblem di atas krem `#F7F5F0`, tanpa transparansi |
| `adaptive-icon-foreground.png` | Android 1024 x 1024 transparan, emblem utuh di dalam lingkaran aman 66% (diameter 676 px). Warna latar adaptive icon: `#F7F5F0` |
| `splash.png` | 1284 x 2778, emblem + wordmark di tengah, latar `#F7F5F0` |

Latar ikon dan splash memakai krem `#F7F5F0`, bukan navy: burung di emblem berwarna navy dan hampir hilang di atas latar navy.

Aturan pakai:

- **Emblem** untuk ukuran kecil (ikon aplikasi, avatar, header aplikasi, notifikasi, di bawah sekitar 120 px).
- **Emblem + wordmark** (atau tulisan SION bold dengan huruf aplikasi, seperti sidebar web) untuk header, layar masuk, dan splash.
- **Logo lengkap** (dengan nama "Sarang Integra Oase Nature" dan slogan) hanya untuk ukuran besar (lebar minimal sekitar 240 px): halaman tentang, dokumen, materi cetak.
- **Logo bundar penuh jangan dipakai di ukuran kecil.** Web saat ini memasukkan logo lengkap (`logo-crop.jpeg`) ke lingkaran 40 sampai 80 px di sidebar dan halaman masuk; tulisan dan slogannya tidak terbaca di ukuran itu. Di mobile pakai emblem saja untuk lingkaran kecil.
- Di atas latar navy, letakkan emblem di dalam lingkaran putih atau krem (seperti web: lingkaran putih dengan garis emas `#C9A24B` 60%).
