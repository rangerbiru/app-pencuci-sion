# Desain SION Mobile

Rencana desain aplikasi Pencuci, Kepala Pencuci, dan Mandor (Tahap 14C). Semua nilai warna, huruf,
radius, dan status diambil dari `docs/web-theme/tokens.json` lewat modul `theme/` (salinan
`theme/tokens.json`, dijaga test `theme/colors.test.ts`). Layar tidak boleh menulis hex sendiri.

## 1. Siapa dan di mana

| Hal | Kenyataan | Akibat untuk desain |
|---|---|---|
| Pengguna | Pencuci sarang walet, Kepala Pencuci, Mandor; tidak terbiasa aplikasi rumit | Satu aksi utama per layar, kata kerja biasa, istilah sama dengan web (GLOSARIUM) |
| Tangan | Sering basah | Target sentuh minimal 48 dp, tombol utama 56 dp, jarak antar tombol minimal 8 dp, tidak ada gestur geser yang wajib |
| Cahaya | Ruang cuci terang | Kontras AA (teks utama di atas 7:1), tidak ada teks abu-abu muda untuk informasi penting |
| HP | Android 2 s.d. 3 GB RAM, layar sekitar 6 inci (360 x 800 dp) | Tanpa animasi hiasan, tanpa blur, daftar ringan, foto dikompres 1280 px |
| Sinyal | Naik turun | Aksi lapangan masuk antrean, tanda "Belum terkirim", banner "Tidak ada sinyal" |

## 2. Token

### Warna (dari tokens.json)

| Peran | Terang | Gelap | Token |
|---|---|---|---|
| Latar layar | `#F7F5F0` krem | `#101828` | `colors.light.background` / `colors.dark.background` |
| Permukaan kartu | `#FFFFFF` | `#171F2E` | `surface` / `surfaceSolid` |
| Garis kartu | `#E4E7EC` | `#1D2939` | `border` |
| Header atas | `#16293F` navy | `#101E2E` | `header` |
| Tombol utama | latar `#C9A24B` emas, teks `#101E2E`, ditekan `#A8842F` | sama | `accent`, `onAccent`, `accentPressed` |
| Teks utama | `#1D2939` | putih 90% | `text` |
| Teks kedua | `#667085` (4,57:1 di krem) | `#98A2B3` | `textSecondary` |
| Sukses | `#2E5C38` di `#CBE3CC` | `#8FC49A` | `accent-600`, `successBg` |
| Bahaya | `#B3413A` di `#FEF2F2` | `#FFA2A2` | `danger`, `dangerBg` |
| Info | `#16293F` di `#EEF2F7` | `#9FB6CC` | `info`, `infoBg` |
| Peringatan | **`#4A3814`** (gold-900) di `#F2E4B8` | `#E3C87A` | lihat catatan kontras |

`textMuted` (`#98A2B3`, 2,58:1 di putih) tidak dipakai untuk teks; hanya untuk garis dan ikon nonaktif.

### Badge status

Label ditampilkan **apa adanya dari API** (`status.label`); warna dari `tokens.status.<jenis>.<kode>.color`
lalu `tokens.badge.colors`. Contoh: `assignment.pending_verification` "Menunggu Verifikasi" (gold),
`weighing_confirmation.menunggu` "Menunggu" (gold), `bonus.pending` "Menunggu" (gold), `withdrawal.disetujui`
"Disetujui" (primary). Setiap badge memakai ikon kecil di depan teks (jam untuk menunggu, centang untuk
selesai/disetujui, silang untuk ditolak, titik untuk netral) supaya tidak bergantung pada warna.
"Bonus Pending" tetap nama saldo; status satu bonus tetap "Menunggu".

**Catatan kontras.** Teks badge gold dari web (`#A8842F` di `#F2E4B8`) hanya 2,76:1, gagal AA di bawah
cahaya terang. Latar badge tetap `#F2E4B8`; teksnya memakai `gold-900` `#4A3814` dari palet yang sama
(8,87:1). Badge lain sudah lolos (primary 13,1; accent 5,7; error 5,1; neutral 4,5).

### Huruf

Google Sans Flex (paket `@expo-google-fonts/google-sans-flex`, OFL), cadangan huruf sistem. Bobot 400,
500, 600 (angka), 700. Semua angka gram dan rupiah memakai `fontVariant: ['tabular-nums']`.

| Gaya | Ukuran / tinggi baris | Pakai untuk |
|---|---|---|
| `display` | 30 / 36 bold | judul layar masuk |
| `title` | 24 / 32 bold | judul layar |
| `heading` | 20 / 28 medium | judul bagian, nama langkah aktif |
| `subheading` | 18 / 28 medium | judul kartu |
| `body` | 16 / 24 | isi (web 14; dinaikkan karena dibaca sambil bekerja) |
| `small` | 14 / 20 | keterangan, baris daftar kedua |
| `caption` | 12 / 18 medium | badge, label tab |
| `numberXL` | 30 / 38 semibold tabular | angka utama satu layar (total minggu, gram diambil) |
| `numberL` | 24 / 32 semibold tabular | angka ringkasan |
| `numberM` | 18 / 28 semibold tabular | angka di baris daftar |

Satuan ("gr", "pcs", "Rp") ditulis lebih kecil dan berwarna teks kedua di samping angka besar, supaya
angka terbaca lebih dulu tetapi satuannya tidak hilang.

Huruf sistem yang diperbesar dihormati (`allowFontScaling` bawaan). Tata letak memakai `minHeight`,
bukan tinggi tetap; baris angka dan label membungkus ke bawah bila tidak muat. Label tab dibatasi
`maxFontSizeMultiplier` 1,3 karena lebarnya tetap.

### Jarak, radius, ukuran

| Token | Nilai | Asal |
|---|---|---|
| satuan | 4 dp | web (Tailwind) |
| tepi layar | 16 dp | `spacing.gutterMobile` |
| padding kartu | 16 dp (web 24 x 20) | dikecilkan untuk 360 dp |
| jarak antar bagian | 24 dp | `spacing.sectionGap` |
| radius kartu | 16 | `radius.card` |
| radius tombol, isian | 8 | `radius.button` / `radius.input` |
| radius badge, avatar | penuh | `radius.badge` |
| tombol utama | tinggi 56 dp | brief (web 48) |
| tombol kedua | tinggi 48 dp | web |
| isian | tinggi 52 dp | web 44, dinaikkan untuk jari basah |
| target sentuh | minimal 48 x 48 dp | brief |

### Bayangan

Kartu biasa tanpa bayangan, hanya garis 1 dp (sama dengan kartu halaman web). Bayangan `xs`
(`0 1 2 rgba(16,24,40,0.05)`, elevation 1) hanya untuk kartu Hari ini dan bilah aksi bawah.

## 3. Prinsip

1. **Satu aksi utama per layar**, berupa tombol emas 56 dp di bilah bawah (zona jempol). Aksi lain
   berupa tombol garis (outline) atau baris daftar.
2. **Urutan nyata hari kerja** adalah tulang punggung Beranda pencuci: Absen masuk, Ambil bahan,
   Serah hasil lembab, Absen pulang. Langkah berikutnya selalu satu tombol besar.
3. **Angka dulu, satuan jelas.** Gram dan rupiah besar, tabular, satuan di sampingnya, nilai kosong "-".
4. **Status selalu teks + ikon**, warna hanya penguat.
5. **Jujur soal sinyal.** Aksi yang belum sampai ke server tampil "Belum terkirim" dengan jumlahnya di
   header; aplikasi mengirim sendiri saat sinyal kembali. Tidak ada aksi yang hilang diam-diam.
6. **Kata kerja jelas, istilah sama.** Tombol "Kirim setoran", toast "Setoran terkirim". Error menjelaskan
   apa yang salah dan cara memperbaikinya, mis. "Gram melebihi sisa jatah (1.200 gr). Kurangi gramnya."
7. **Gerak hanya untuk menjawab aksi**: toast masuk, detail terbuka. Haptic ringan saat berhasil.
   Bila "Kurangi gerak" aktif, toast dan skeleton tampil tanpa animasi.
8. **Tenang dan disiplin**: navy hanya di header, emas hanya untuk aksi utama dan langkah aktif,
   selebihnya krem, putih, dan garis tipis.

## 4. Komponen dasar (`components/elements`)

| Komponen | Isi |
|---|---|
| `Text` | varian tipografi, warna dari tema, angka tabular untuk varian `number*` |
| `Button` | `primary` (emas 56), `secondary` (outline 48), `danger` (outline merah), `ghost`; status muat; tanpa panah |
| `Badge` | status dari API + jenis tokens -> warna; ikon di depan teks |
| `Card` | permukaan putih, garis 1 dp, radius 16, tanpa bayangan (kecuali `raised`) |
| `Amount` | angka besar tabular + satuan kecil (gr, pcs, Rp) |
| `TextField` | label di atas, isian 52 dp, pesan error merah di bawah dengan ikon, keyboard angka |
| `ListRow` | baris 56+ dp, judul, keterangan, kanan: nilai atau badge, chevron bila bisa dibuka |
| `Skeleton` | balok abu-abu, berdenyut pelan kecuali Kurangi gerak |
| `EmptyState` | kalimat apa yang terjadi + tombol aksi berikutnya |
| `ErrorState` | pesan + tombol "Coba lagi" |
| `OfflineBanner` | "Tidak ada sinyal. Data yang dikirim disimpan dulu." |
| `PendingChip` | "Belum terkirim (n)" di header, buka daftar antrean |
| `BottomBar` | wadah tombol utama di bawah, aman dari bilah navigasi |
| `Toast` | konfirmasi singkat + haptic |
| `CameraCapture` | kamera depan/belakang, bingkai panduan, ambil ulang, pratinjau |
| `Screen` | latar krem, tarik untuk menyegarkan, banner sinyal |

## 5. Wireframe (360 dp)

### Masuk

```
┌──────────────────────────────┐
│                              │
│         [logo lengkap]       │  logo lengkap hanya di sini dan splash
│                              │
│  Masuk                       │  title
│  Pakai akun Pencuci, Kepala  │
│  Pencuci, atau Mandor.       │
│                              │
│  Email atau nomor HP         │
│  [ 0812...               ]   │  52 dp
│  Password                    │
│  [ ••••••••          (o) ]   │  tombol mata 48 dp: Tampilkan/Sembunyikan
│  ! Email/nomor HP atau       │  error dari API apa adanya
│    password salah.           │
│                              │
│  Lupa password? Hubungi      │
│  Mandor atau Admin.          │
├──────────────────────────────┤
│  [         Masuk          ]  │  emas 56 dp, bilah bawah
└──────────────────────────────┘
```

### Beranda Pencuci

```
┌──────────────────────────────┐
│ (emb) Selamat pagi, Siti     │  header navy, emblem dalam lingkaran krem
│       Rabu, 7 Oktober 2026   │  [Belum terkirim 2] chip bila ada
├──────────────────────────────┤
│ ! Tidak ada sinyal ...       │  hanya saat offline
│                              │
│ ┌ Hari ini ────────────────┐ │  kartu raised, satu-satunya berbayang
│ │ (v) Absen masuk   07:58  │ │  selesai: centang hijau + jam server
│ │  │                       │ │
│ │ (2) Ambil bahan          │ │  aktif: lingkaran emas, teks tebal
│ │  │  1 menunggu disetujui │ │  ringkasan langkah
│ │ (3) Serah hasil lembab   │ │  belum: lingkaran garis abu
│ │  │                       │ │
│ │ (4) Absen pulang         │ │
│ │                          │ │
│ │ [     Ambil bahan      ] │ │  satu tombol besar = langkah berikutnya
│ │  Ambil kerja ulang       │ │  tombol kedua bila ada kerja ulang
│ └──────────────────────────┘ │
│                              │
│ ┌ Konfirmasi hasil timbang ┐ │  hanya bila ada
│ │ Kartu 24/09  12.156 gr   │ │
│ │ Utuh 8.518 Kecil 900 ... │ │
│ │ Sisa 5 jam 12 menit,     │ │
│ │ setelah itu dianggap     │ │
│ │ setuju.                  │ │
│ │ [Tidak setuju] [ Setuju ]│ │
│ └──────────────────────────┘ │
│                              │
│ Jatah aktif                  │  daftar, bukan kartu identik
│ B-MOB Bulu Berat             │
│ sisa 27.000 gr  ▓▓▓░░ 32%    │
│                              │
│ Saldo dapat dicairkan        │
│ Rp 280.000          [Tarik]  │
└──────────────────────────────┘
│ Beranda Pendapatan Riwayat Profil │  tab
```

### Absen (kamera)

```
┌──────────────────────────────┐
│ <  Absen masuk               │
│ Jam server 07:58             │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │      ( oval wajah )      │ │  kamera depan, bingkai oval
│ │                          │ │
│ └──────────────────────────┘ │
│ Lokasi: Di lokasi kerja /    │
│ ! Di luar lokasi (1.112 m)   │  bila server menandai luar lokasi
├──────────────────────────────┤
│ [         Ambil foto       ] │
└──────────────────────────────┘
setelah foto:  [Ambil ulang]  [   Kirim absen masuk   ]
```

### Ambil bahan (3 langkah, satu aksi per langkah)

```
1 Pilih jatah            2 Foto timbangan           3 Isi dan periksa
┌──────────────────┐    ┌──────────────────┐      ┌──────────────────┐
│ ( ) B-MOB        │    │ ┌──────────────┐ │      │ [foto kecil]     │
│     Bulu Berat   │    │ │ ┌──────────┐ │ │      │ Gram             │
│     sisa 27.000gr│    │ │ │ layar    │ │ │      │ [ 12.500    ] gr │
│ ( ) B-XYZ ...    │    │ │ │ timbangan│ │ │      │ Sisa 27.000 gr   │
│                  │    │ │ └──────────┘ │ │      │ Pcs (opsional)   │
│                  │    │ └──────────────┘ │      │ [ 100       ]    │
├──────────────────┤    ├──────────────────┤      ├──────────────────┤
│ [   Lanjut     ] │    │ [ Ambil foto   ] │      │ [ Periksa      ] │
└──────────────────┘    └──────────────────┘      └──────────────────┘
Ringkasan: jatah, gram (besar), pcs, foto -> [ Kirim pengambilan ] -> toast "Pengambilan terkirim"
```

### Pendapatan

```
┌──────────────────────────────┐
│ Pendapatan                   │
│ [<]  Minggu 38               │  pilih minggu, 48 dp
│      14/09/2026 s.d. 20/09   │
│                              │
│ Total minggu ini             │
│ Rp 280.000                   │  numberXL
│ Dibayar SION                 │  badge
│                              │
│ Rincian                      │  seperti slip gaji, baris rata kanan
│ Upah sudah dihitung   Rp 0   │
│ Gaji harian      Rp 180.000  │
│ Bonus mingguan   Rp 100.000  │
│ ──────────────────────────── │
│ Per hari                     │
│ Sen, 14 Sep  Hadir    250 gr │  baris bisa dibuka: kartu + status upah
│ ...                          │
│                              │
│ Bonus berjalan               │
│ Bonus mingguan  [Menunggu]   │
│ 120 / 240 gr ▓▓▓▓░░░░        │
│ THR (bertambah per hari) ... │
│                              │
│ Profit harian (bila diizinkan│
│                              │
│ Saldo                        │
│ Dapat dicairkan Rp 280.000   │
│ Bonus Pending   Rp 100.000   │
│ THR Ditahan      Rp 22.400   │
│ Sumber dana: SION / Mandor X │
├──────────────────────────────┤
│ [        Tarik dana       ]  │
└──────────────────────────────┘
```

### Tarik dana

```
Saldo dapat dicairkan Rp 280.000 (Mandor Pak Budi bila Borongan)
Nominal [ Rp 100.000 ]   minimal Rp 50.000, maksimal saldo
Catatan (opsional)
[ Ajukan penarikan ] -> konfirmasi "Ajukan Rp 100.000?" -> toast "Penarikan diajukan"
Riwayat: baris per pengajuan + badge + diproses oleh; tombol "Batalkan" selama Diajukan
```

### Riwayat

```
Daftar hari: Rab, 24 Sep   bahan 12.500 gr  lembab 240 pcs  hasil 12.156 gr
             [Lolos QC] [Standard] [Menunggu] [Tertahan]
Detail hari: kartu (bahan, hasil per grup, QC, konfirmasi, upah) + pengajuan dengan foto
```

### Tim (Kepala Pencuci)

```
Ringkasan: Hadir 5/7  Menunggu verifikasi 3   [Verifikasi]
Anggota (baris): nama, badge absen, jatah sisa, setoran hari ini, pengajuan menunggu
Profit harian tim (7 hari)
Bonus tim: 4/6 anggota capai (data per anggota belum ada di API)
Lainnya: Kartu Kerja, Penjatahan, Batch masuk (bila API mengizinkan)
```

### Verifikasi

```
[Semua] [Ambil bahan] [Serah hasil] [Kerja ulang]   filter
[ ] Siti   Ambil Bahan   12.500 gr  08:00  [foto]
[ ] Ani    Serah Lembab     240 pcs ...
bilah bawah saat ada pilihan: [Tolak] [ Setujui 3 ]
detail: foto besar (ketuk = layar penuh), data, Setujui / Tolak (alasan wajib min 5 huruf)
```

### Beranda Mandor

```
Hari ini
Hadir 12 / 15        Menunggu verifikasi 4
Kartu belum QC 3     Batch belum diterima 1
Penarikan Borongan menunggu 2
(setiap angka = baris yang membuka layarnya)
Absen saya: kartu absen kecil
```

### Batch

```
Batch masuk: B-MB Mangkok, dikirim 6.000 gr [Diserahkan] -> Terima batch
Terima batch: [Scan QR wadah] bruto - tara = gram diterima (tidak boleh > 6.000 gr)
              pcs, foto, catatan selisih (wajib bila ada selisih) -> [ Terima batch ]
Penjatahan: batch Diterima/Berjalan, sisa gram; tambah baris pencuci + target gram -> [ Simpan penjatahan ]
```

### Kartu Kerja (Mandor)

```
Tanggal [<] 24/09/2026 [>]   daftar per pekerja + badge status/QC
Detail: bahan, hasil per baris (gram bersih, pcs) -> QC [Standard] [Belum Standard]
Belum Standard: tanggal kerja ulang wajib -> [ Simpan QC ]; kartu lolos QC: [ Verifikasi ]
```

### Profil

```
(emblem) Siti  [Pencuci]
Email, HP, lokasi, Kepala Pencuci, Mandor
Kontrak berlaku: sejak 01/01/2026, komponen upah
Ganti password  >
Belum terkirim (2) >
[ Keluar ]  (peringatan bila masih ada yang belum terkirim)
Versi 1.0.0
```

### Perbarui aplikasi

```
(emblem)  Perbarui aplikasi
Versi Anda 1.0.0. Versi minimal 1.2.0. Minta file APK terbaru ke Mandor atau Admin.
[ Periksa lagi ]
```

## 6. Tinjauan terhadap brief: yang diganti dan alasannya

Draf pertama rencana ini masih membawa pola template. Bagian berikut diganti setelah ditinjau terhadap
brief:

| Draf awal (generik) | Diganti dengan | Alasan |
|---|---|---|
| Beranda berisi kisi 4 kartu statistik sama besar (hadir, gram, upah, saldo) dengan ikon di pojok | Kartu "Hari ini" berupa rel langkah vertikal; angka lain jadi daftar biasa | Brief: elemen khas adalah urutan hari kerja. Kisi kartu identik adalah ciri tampilan AI dan memaksa pencuci memilih sendiri apa yang harus dilakukan |
| Label kecil huruf kapital berjarak ("RINGKASAN", "SALDO") di atas tiap judul | Judul kalimat biasa 18 dp medium | Dilarang brief; juga lebih sulit dibaca pengguna yang jarang membaca |
| Tombol utama navy dengan teks "Lanjut →" | Tombol emas `#C9A24B`, teks navy, tanpa panah | Sama dengan web; brief melarang panah di teks tombol |
| Semua kartu berbayang abu-abu seragam | Garis 1 dp tanpa bayangan; hanya Hari ini dan bilah bawah berbayang `xs` | Web memakai kartu tanpa bayangan; satu bayangan menandai yang terpenting |
| Header bergradien navy ke biru | Header navy polos `#16293F` dengan emblem dalam lingkaran krem bergaris emas | Brief melarang gradient hiasan; emblem navy tenggelam di navy tanpa lingkaran (README logo) |
| Meta baris "Siti · 08:00 · 12.500 gr" | Nilai di baris sendiri atau pasangan label: nilai | Brief melarang pemisah titik tengah |
| Tombol aksi melayang (FAB) di kanan bawah | Bilah bawah selebar layar 56 dp | Zona jempol untuk dua tangan dan jari basah; FAB mudah tertutup dan ambigu |
| Modal sukses dengan animasi centang besar | Toast singkat + haptic ringan, lalu kembali ke Beranda | Gerak hanya menjawab aksi; HP kelas bawah |
| Status upah hanya titik warna | Badge teks + ikon dari tokens | Brief: bukan warna saja; buta warna dan cahaya terang |
| Pendapatan berupa grafik batang mingguan | Slip gaji: total besar, lalu baris rincian rata kanan | Pekerja terbiasa slip; grafik tidak menjawab "berapa yang saya terima" |
| Form ambil bahan satu halaman panjang (jatah, foto, gram, pcs) | Tiga langkah, masing-masing satu aksi, lalu ringkasan | Satu aksi per layar; foto timbangan butuh layar penuh |
| Teks badge gold persis web | Teks gold-900 di latar gold-100 yang sama | Gagal AA (2,76:1) di cahaya terang |
| Skeleton berkilau (shimmer) | Balok berdenyut pelan, diam bila Kurangi gerak | Hemat GPU, hormati aksesibilitas |
| Tab bar dengan ikon saja | Ikon + label | Pengguna tidak terbiasa ikon abstrak |

## 7. Bahasa

- Tombol = kata kerja + benda: "Absen masuk", "Kirim pengambilan", "Kirim setoran", "Terima batch",
  "Ajukan penarikan", "Setujui", "Tolak".
- Toast = benda + hasil: "Absen masuk tercatat", "Pengambilan terkirim", "Setoran terkirim",
  "Disimpan. Dikirim otomatis saat ada sinyal."
- Layar kosong memberi aksi: "Belum ada jatah aktif. Minta Mandor membuat penjatahan." (tombol Muat ulang),
  "Belum ada pengajuan untuk diverifikasi." (tombol Muat ulang).
- Error: dari API apa adanya bila ada (`message`/`errors`), selain itu pesan per kode di
  `services/api/errors.ts`.

## 8. Swa-kritik pratinjau web

Pratinjau `npx expo start --web` dengan API tiruan (data contoh sesuai bentuk `docs/API_MOBILE.md`),
kamera palsu Chrome, dan Playwright di 360 x 800 dan 412 x 915. Tiga putaran; yang diperbaiki:

| Putaran | Temuan | Perbaikan |
|---|---|---|
| 1 | Badge "Menunggu" dan "Tertahan" di Riwayat tidak jelas milik apa | Badge diberi konteks di depan label API: "Timbang: Menunggu", "Upah: Tertahan", "QC: Standard". Label API tetap utuh |
| 1 | Label tab Mandor terpotong ("Verifik...", "Kartu K...") | "Kartu Kerja" jadi "Kartu" di tab, label tab mengecil otomatis (`adjustsFontSizeToFit`), 6 tab memakai huruf 10 |
| 1 | Isian sempit (gram/pcs bersih) meluap dan satuan "gr" hilang | `minWidth: 0` pada isian |
| 1 | Tombol "Lanjut foto timbangan" abu-abu mati sebelum memilih jatah | Jatah tunggal terpilih otomatis; tombol selalu aktif dan memberi pesan "Pilih jatah yang diambil dulu." |
| 1 | Tombol kerja ulang terlalu panjang dan membungkus dua baris | "Ambil kerja ulang, 20 pcs" |
| 2 | Kartu kerja mengulang nama pekerja di header dan kartu | Header = nama, kartu = "Kartu dd/mm/yyyy" |
| 2 | Foto verifikasi dipotong (cover); angka timbangan bisa terpotong | Foto lebar memakai `contain` di latar abu muda |
| 3 | "Sisa setelah ini" merah padahal belum ada isian; tombol simpan mati | Merah hanya bila melebihi sisa; tombol aktif dan menjelaskan isian yang kurang |
| 3 | Tombol "Cari wadah" mati saat kode kosong | Tombol muncul setelah kode diketik |

## Tahap 14C-R: tangkapan layar data asli

Tangkapan di `docs/screenshots/` diambil dari pratinjau web dengan API asli (database demo
`sion_wms_mobile`, 09/10/2026), nama berkas `{lebar}-{mode}-{peran}-{nn}-{layar}.png`:
lebar 360 x 800 dan 412 x 915, mode `light` dan `dark`. Layar: Masuk; Pencuci: Beranda, Ambil bahan,
Pendapatan, Tarik dana, Riwayat, Profil; Kepala Pencuci: Beranda, Verifikasi, Tim, Progres bonus
tim, Pendapatan; Mandor: Beranda, Batch (penjatahan), Verifikasi, Kartu Kerja (semua), Detail kartu
dan QC, Akun, Dana Mandor, Penarikan Borongan. Foto di tangkapan berasal dari kamera uji (gambar
buatan), bukan foto orang.

Tinjauan (frontend-design, design-taste-frontend, ui-ux-pro-max), putaran 1 lalu diperbaiki:

| Temuan | Perbaikan |
|---|---|
| Label tab terpotong di 360 dp | Bilah tab sendiri; ukuran label mengikuti besar huruf, dipecah dua baris atau dikecilkan |
| Garis putih kedua di dalam isian (outline web) | Outline web dan garis bawah Android dimatikan; satu garis 1 px, fokus emas 2 px |
| Efek tekan baris menyisakan tepi kiri/kanan | Baris membawa padding sendiri; kartu memotong efek tekan di sudutnya |
| "Rp" terpisah dari angka saat turun baris | Spasi tak terputus di format rupiah dan gram |
| Petunjuk kamera tertutup tombol Ambil foto (360 dp) | Bingkai kamera mengisi sisa tinggi, bukan rasio tetap |
| Tim: "Bahan hari ini - Lembab - Hasil -" pecah tak rapi | "Belum ada kartu hari ini" bila belum ada kartu |
| Dana Mandor: "Pengajuan aktif Rp 0" di setiap pencuci | Baris hanya tampil bila ada nominal |
| Badge "Menunggu" di Riwayat tanpa konteks | Awalan "Timbang: Menunggu" |
| Logo bertulisan navy tidak terbaca di mode gelap | Alas terang di belakang logo layar masuk |

## Arah visual v2 (Tahap 14C-R2, menunggu persetujuan)

Skill yang dipakai: vercel-react-native-skills, ui-ux-pro-max, design-taste-frontend, frontend-design.

Design read: aplikasi kerja lapangan Android (HP kelas bawah, tangan basah, ruang cuci terang) untuk
tim pencucian sarang walet; bahasa visual "utilitas hangat yang tepercaya"; memakai token SION
(navy, emas, krem) dengan kartu bertingkat, grafik SVG ringan, dan gerak yang menjawab sentuhan.
Dial: variasi 4, gerak 5, kepadatan 5 (layar kerja harian, bukan halaman pemasaran).

### Referensi (`docs/referensi-desain/`) dan pola yang diambil

| Gambar | Pola yang diambil | Yang sengaja tidak diambil |
|---|---|---|
| design2 (HR absensi, tiga layar) | Header kartu: avatar, "Hai, nama", baris kecil di bawahnya, lonceng dengan badge angka. Kartu absen sebagai pusat Beranda: jam berjalan besar, tanggal, tombol bulat besar, kotak Masuk/Pulang berisi jam, bilah durasi. Kartu "Ringkasan bulanan" berisi ubin ikon + label + angka. Cincin progres dengan angka di tengah dan keterangan "3 / 5 selesai". Kartu horizontal dengan bilah progres. Tombol aksi melayang (extended FAB) di kanan bawah. | Warna toska dan gradasi kaca bertumpuk; blur sungguhan; segmented "Personal/Group" yang berpendar; daftar chat. |
| design3 (aplikasi jasa servis) | Header ringan di latar layar (bukan bilah berwarna) dengan lonceng berbulatan; satu kartu "hero" berwarna merek dengan dua tombol; kisi aksi cepat ikon + label; bilah tab dengan pil di tab aktif dan label. | Foto orang di hero, karusel bertitik, kolom cari, strip "terverifikasi/garansi", harga coret. Tidak relevan untuk alat kerja. |
| design4 (fintech) | Sapaan kecil redup di atas nama tebal; kartu saldo berwarna merek dengan tombol pil di dalamnya; baris aksi cepat bulat; daftar transaksi: ikon bulat kiri, judul + keterangan, nominal + waktu kanan; chip filter; isian nominal dengan chip nominal cepat; layar berhasil: centang besar, nominal, rincian, tombol Selesai; menu profil berbaris dengan chevron. | Hijau merek PayNest, logo bank, ilustrasi 3D, header profil berwarna penuh. |

Ringkasnya: **kartu hero berwarna navy satu per layar**, ubin ringkasan bersudut lembut, cincin dan
bilah progres SVG, sapaan + lonceng di header terang, pil tab, dan aksi utama melayang di zona jempol.

### Tinjauan rencana terhadap brief (sebelum kode)

- Hampir terjebak pola umum "kartu gradasi + angka besar + statistik" di setiap layar. Diputuskan:
  hanya **satu** kartu navy per layar (Beranda Pencuci: absen; Pendapatan: saldo; Beranda Mandor:
  batch masuk). Kartu lain putih/krem bergaris 1 px, supaya kartu utama benar-benar menonjol.
- Krem + navy + emas adalah identitas SION dari web (tokens.json), bukan pilihan bawaan; tetap.
- Efek kaca = permukaan putih semi transparan di atas kartu navy (`rgba(255,255,255,0.08)`), tanpa
  `backdrop-filter`/expo-blur (berat di HP murah).
- Tidak ada label kapital berjarak, tidak ada titik dekoratif; badge hanya untuk status nyata.
- Penyimpangan dari vercel-react-native-skills: bilah tab tetap JS (expo-router Tabs) karena tab
  native tidak bisa menggambar indikator pil yang bergeser; tumpukan layar tetap native stack.

### Token tambahan v2 (`theme/motion.ts`, `theme/metrics.ts`)

| Token | Nilai | Pakai |
|---|---|---|
| Gradasi merek terang | navy `primary-600 #16293F` ke `primary-500 #1E3A5F`, diagonal | kartu hero (SVG LinearGradient) |
| Gradasi merek gelap | `primary-700 #101E2E` ke `primary-500`, garis 1 px `rgba(255,255,255,0.08)` | kartu hero mode gelap |
| Permukaan kaca | `rgba(255,255,255,0.08)` (teks putih), garis `rgba(255,255,255,0.12)` | ubin di dalam kartu hero |
| Radius | hero 24, kartu 16, ubin dan isian 12, tombol 12, pil/badge 999 | satu skala untuk semua layar |
| Bayangan | hero: `#16293F` opasitas 0,16, radius 16, elevasi 4; kartu biasa tanpa bayangan (garis 1 px) | hanya kartu hero dan tombol melayang |
| Durasi | tekan 120, keluar 150, masuk 220, accordion 220, toast 240, lembar bawah 280, isi progres 700, hitung naik 600 (ms) | 150 s.d. 300 ms untuk perubahan UI; isi progres dan hitung naik sekali saat tampil |
| Kurva | `Easing.out(Easing.cubic)` untuk masuk dan isi; spring tekan `{damping 18, stiffness 320, mass 0.6}`; spring lembar `{damping 22, stiffness 220}` | |
| Bertahap | 35 ms per item, maksimal 8 item pertama, fade + geser naik 8 dp, hanya saat layar pertama dibuka | daftar dan ubin Beranda |
| Tekan | skala 0,97 + haptic ringan (expo-haptics `ImpactFeedbackStyle.Light`) | kartu dan tombol yang bisa ditekan |
| Denyut | skala 1 ke 1,04, 1.200 ms bolak-balik, hanya tombol Absen saat belum absen | satu-satunya animasi berulang |
| Kurangi gerak | `useReducedMotion()`: tanpa bertahap, hitung naik, denyut, goyang lonceng; isi progres langsung | perubahan status tetap terlihat |

Huruf untuk layar contoh memakai skala baru dari bagian 1 brief (isi 15, kecil 13, judul layar 18,
judul kartu 16, angka besar 24 s.d. 28, tinggi baris 1,4x); pilihan keluarga huruf menunggu
perbandingan di bagian 1.

### Layar contoh v2 (tiga layar)

```
Beranda Pencuci                 Pendapatan                      Beranda Mandor
+---------------------------+   +---------------------------+   +---------------------------+
| (S) Hai, Siti         (3)🔔|   | Pendapatan            🔔  |   | (J) Hai, Pak Joko     (5)🔔|
|     Pencuci, tim Bu Sari  |   |                           |   |     Mandor                |
| +=======================+ |   | +=======================+ |   | +=======================+ |
| | Jumat, 10 Okt          | |   | | Saldo dapat dicairkan | |   | | Batch masuk           | |
| | 13:42:08      ( O )    | |   | | Rp 3.747.500          | |   | | B-MOB-IN, Sudut Putih | |
| | [Masuk 07:50][Pulang -]| |   | | Dana Mandor Pak Joko  | |   | | 3.000 gr dikirim      | |
| | ▓▓▓▓░░ 5 j 52 m kerja  | |   | | [pending][THR]  (Tarik)| |   | |          (Terima)     | |
| +=======================+ |   | +=======================+ |   | +=======================+ |
| Hari ini                  |   | < Minggu 41 >             |   | [Hadir 2/3][Verif 2]     |
| [Ambil] [Serah] [Ulang]   |   | Rincian (baris uang)      |   | [Belum QC 1][Tarik 0]    |
| ! Konfirmasi timbang      |   | Bonus mingguan ▓▓▓░ 63%   |   | Batch & penjatahan        |
| Target minggu ini (◔ 63%) |   | Per hari (accordion)      |   | B-MOB-IN ▓▓▓▓░ 75% dijatah|
| Ringkasan bulan ini 2x2   |   | THR dan bonus             |   | Hasil 7 hari (donat)      |
|               (Ambil bahan>)|  |                           |   |            (Terima batch>)|
| [Beranda][Pendapatan]...  |   | [tab]                     |   | [tab]                     |
+---------------------------+   +---------------------------+   +---------------------------+
```

Aksi utama per peran: tombol melayang (extended FAB) di kanan bawah, tepat di atas bilah tab, hanya
di Beranda (Pencuci: langkah berikutnya hari ini; Mandor: Terima batch bila ada batch masuk).
Dipilih daripada tombol tengah di bilah tab karena Mandor sudah punya 5 tab: tombol keenam membuat
label tab mengecil di 360 dp.

Tangkapan dan rekaman layar contoh v2 ada di `docs/screenshots/v2/`: `360-{light,dark}-pencuci-beranda.png`,
`360-{light,dark}-pendapatan.png`, `360-{light,dark}-mandor-beranda.png`, dan `animasi-v2.webm`
(pratinjau web, data demo: muncul bertahap, cincin/bilah/donat terisi, saldo menghitung naik, denyut
tombol absen, pil tab bergeser). Haptic dan worklet hitung naik hanya terasa di HP.

## Bagian 1 (14C-R2): huruf, skala, ikon

### Perbandingan huruf

Tangkapan 360 dp mode terang, data demo yang sama, di `docs/screenshots/v2/huruf/`
(`360-{jakarta,inter,googleSans}-{masuk,beranda,pendapatan}.png`). Angka tabular diukur di browser
(lebar "1111" = "0000" dengan `tabular-nums`, 40 px):

| Huruf | Angka tabular | Lebar 4 angka | Catatan di layar |
|---|---|---|---|
| **Plus Jakarta Sans** (dipilih) | ada | 96 px | angka paling ramping, bentuk 1/7/4 jelas; huruf sedikit lebih lebar, "Ambil bahan" turun 2 baris di ubin |
| Inter | ada | 104 px | paling lebar: "Durasi kerja ..." dan "Bonus menunggu" terpotong; dihindari sebagai bawaan (design-taste) |
| Google Sans Flex (lama) | ada | 103 px | paling ringkas tetapi generik; angka lebih lebar dari Jakarta |

Pilihan: **Plus Jakarta Sans**. Dibuat Tokotype (Jakarta) untuk identitas Jakarta, terasa hangat dan
lokal untuk tim pencucian; angka tabularnya paling ramping sehingga rupiah dan gram panjang muat di
360 dp, dan bentuk angkanya jelas di bawah cahaya terang. Kelebihan lebar hurufnya ditangani di tata
letak (label boleh dua baris, tidak dipotong). Hanya satu keluarga dimuat (4 ketebalan) lewat
`@expo-google-fonts/plus-jakarta-sans` dan plugin `expo-font`; Inter dan Google Sans Flex dihapus.

### Skala

Isi 15, kecil/meta/label 13, keterangan 12, judul layar 18, nama di header 17, judul kartu 16, angka
17 (baris), 24 (ubin), 28 (saldo/total), jam absen 34; tinggi baris sekitar 1,4x. Semua `Text` memakai
`maxFontSizeMultiplier` 1,3 (jam absen 1,1) supaya pembesaran huruf sistem tidak merusak tata letak.

### Ikon

Satu set: Feather (`@expo/vector-icons`). Arti tetap per perintah ada di `theme/icons.ts`:
absen masuk `log-in`, absen pulang `log-out`, ambil bahan `download`, serah hasil `upload`, kerja
ulang `repeat`, terima batch `inbox`, penjatahan `users`, penyiapan `layers`, verifikasi `shield`,
setujui `check`, tolak `x`, foto `camera`, galeri `image`, scan wadah `maximize`, tambah `plus`, hapus
`trash-2`, muat ulang `refresh-cw`, uang/saldo `credit-card`, tarik dana `arrow-down-circle`,
notifikasi `bell`, hubungi Admin `message-circle`. Diperbaiki: tombol absen tidak lagi memakai
`camera`, uang tidak lagi `dollar-sign`, terima batch dibedakan dari ambil bahan, verifikasi kartu
`shield` (bukan gembok).

## Bagian 2 (14C-R2): tombol

Satu komponen `components/elements/Button` untuk semua tombol berteks:

| Hal | Aturan |
|---|---|
| Tinggi | utama 48 dp, sekunder/danger/ghost 44 dp (hitSlop 2 dp atas-bawah, target sentuh tetap 48) |
| Bentuk | radius 12, teks 15 semibold, kalimat biasa (tidak kapital semua), ikon 18 di kiri |
| Lebar | selebar isinya (`alignSelf: flex-start`); lebar penuh hanya `fullWidth` atau di BottomBar (`flex: 1`). Pengecualian: tombol Masuk di layar masuk (satu-satunya aksi form). |
| Tekan | warna tekan + skala 0,97 (spring, shared value) + haptic ringan |
| Nonaktif | opasitas 0,45, `accessibilityState.disabled` |
| Memuat | spinner kecil menggantikan ikon, label tetap terlihat (lebar tidak melompat), `busy` |

Pressable + shared value, bukan Gesture.Tap: tombol juga dipakai di dalam `Modal` (lembar konfirmasi),
tempat gesture handler tidak berjalan di Android tanpa root tambahan. Tombol hero (Tarik dana, Terima
batch) kini memakai komponen yang sama.

## Bagian 3 (14C-R2): header dan notifikasi

Header Beranda: avatar inisial 40 dp, sapaan 13 redup, nama 17 semibold, tanggal + peran/tim 13;
lonceng 44 dp di kanan semua layar utama (badge merah angka, pop + goyang sekali saat bertambah).
Tanggal pindah dari kartu absen ke header (kartu absen menulis "Jam server").

Layar Notifikasi: kelompok per hari, baris = ikon jenis dalam lingkaran berwarna badge, judul (tebal
bila belum dibaca), jam, isi satu kalimat, titik emas belum dibaca; latar biru muda (`infoBg`) untuk
yang belum dibaca. Ikon per jenis ada di `scenes/notifications/notificationView.ts`.

## Bagian 4 (14C-R2): accordion

Satu komponen `components/elements/Accordion` (Reanimated, tanpa LayoutAnimation dan tanpa layout
animation Reanimated): isi diukur di posisi absolut, tinggi dianimasikan 220 ms ease-out dari 0 ke
tinggi terukur (shared value, ikut berubah bila isi bertambah tinggi saat terbuka), isi memudar masuk
(opasitas 0 ke 1, tertinggal sedikit dari tinggi), chevron berputar 180 derajat. Isi dipasang saat
pertama dibuka lalu tetap terpasang. Hanya satu terbuka (`useSingleOpen`). "Kurangi gerak": langsung
buka/tutup. Isi yang tertutup disembunyikan dari pembaca layar dan tidak bisa disentuh. Diuji di web:
tinggi sampel tiap 40 ms 284 > 129 > 61 > 22 > 0 (tutup) bersamaan 0 > 47 > 67 > 79 > 86 (buka).
Dipakai di Pendapatan per hari, Riwayat, konfirmasi timbang di Beranda, dan kartu pengajuan.

## Bagian 5 (14C-R2): kartu pengajuan ringkas

`scenes/history/SubmissionItem.tsx` (memakai Accordion yang sama). Tertutup: foto 40 dp, "Ambil bahan,
250 gr, 30 pcs" (kalimat biasa), jam, badge status. Terbuka: Batch dan item, tanggal kerja, dikirim,
foto diambil, diputuskan oleh siapa dan kapan, alasan ditolak (merah), foto lebar yang bisa diketuk
untuk diperbesar. Dipakai di Detail hari (Riwayat) dan antrean Verifikasi Kepala/Mandor. Di antrean:
nama pencuci di judul, tanggal kerja di keterangan, badge status disembunyikan (semuanya Menunggu)
supaya judul tidak terjepit, kotak centang pilih banyak di kiri, dan di rincian tombol Setujui, Tolak,
Buka detail. Tidak ada geser untuk menyetujui; Setujui (satu atau beberapa) selalu lewat lembar
konfirmasi bawah, Tolak lewat lembar alasan.

## Bagian 6 (14C-R2): menyegarkan, kerangka muat, daftar efisien

- Tarik untuk menyegarkan ada di semua layar daftar/detail (termasuk detail penarikan tim). Warna
  merek: lingkaran emas (`accentPressed`, lalu navy) di atas `surface` (Android), emas di iOS.
- `staleError(...queries)` (`services/api/staleError.ts`) mengambil galat kueri yang masih punya isi.
  `Screen refreshError` menampilkan pita kuning kecil "Belum bisa menyegarkan. <pesan> Data di bawah
  dari pembaruan terakhir." + Coba lagi di atas isi; isi lama tetap. ErrorState layar penuh hanya
  bila belum ada isi sama sekali (`error && !data`).
- `forCurrentArg(query)`: layar yang argumennya berganti (Kartu Kerja per tanggal, Riwayat 7/30/62
  hari, Progres bonus per minggu, Penarikan tim per status) memakai `currentData`, jadi saat berganti
  tampil kerangka, bukan "0 kartu" milik tanggal sebelumnya.
- Kerangka mengikuti bentuk isi (`components/elements/Skeleton`): `SkeletonRows` (kartu berisi baris
  bergaris, opsi gambar 40 dp di kiri, pil status di kanan), `SkeletonHero` (hero 196 + ubin), dan
  `SkeletonDetail` (judul + pil, pasangan label/nilai, foto 4:3). Kilau bergeser 1,2 detik, diam
  bila "Kurangi gerak".
- Daftar tak berbatas memakai FlashList 2 lewat `Screen list={...}`: FlashList menjadi penggulir,
  `children` jadi kepala daftar, header/bilah bawah/tarik-segarkan sama seperti layar biasa.
  `CardSegment` membuat baris-baris FlashList tampak sebagai satu kartu (sudut hanya di baris pertama
  dan terakhir). Baris di-memo, `keyExtractor`/`getItemType` di luar render, `onEndReached` memuat
  halaman berikut. Dipakai di Notifikasi (judul hari + baris, dua jenis item) dan Kartu Kerja "Semua".
  Daftar lain pendek dan terbatas (tim, satu hari, satu minggu) tetap di ScrollView.
- `Image` (expo-image) memakai `cachePolicy` memori + disk dan `recyclingKey` = alamat foto.

