# PRD SION Mobile (spesifikasi hidup)

Status: 10/10/2026, sesudah Tahap 14C-R. Dokumen ini menggambarkan perilaku aplikasi **seperti yang
ada di kode sekarang**. Setiap perubahan perilaku wajib memperbarui dokumen ini di commit yang sama.

Sumber: prompt Tahap 14C dan 14C-R, `docs/API_MOBILE.md` (kontrak API, Lampiran A = bentuk respons
asli), `docs/DESIGN_MOBILE.md` (token, wireframe, tinjauan), `docs/web-theme/` (tokens.json,
glosarium), PRD SION v2 bagian 8.3 dan 11.

**Sumber kebenaran ada di server.** Aplikasi tidak menghitung ulang upah, bonus, THR, PPE, saldo,
sisa jatah, atau status. Angka uang dan gram dari API (string desimal) hanya diformat. Validasi di
HP hanya untuk umpan balik cepat; server memeriksa ulang dengan aturan yang sama dengan web.

## 1. Tujuan dan pengguna

Aplikasi Android (iOS menyusul) untuk tim jasa pencucian sarang walet yang bekerja untuk SION.
Satu tim terdiri dari:

| Peran | Siapa | Kebutuhan utama di aplikasi |
|---|---|---|
| Pencuci | pekerja harian di rumah pencucian, sering dengan tangan basah, HP kelas bawah, sinyal putus-putus | absen, ambil bahan, serah hasil, kerja ulang, konfirmasi timbang, lihat pendapatan, tarik dana |
| Kepala Pencuci | pengawas beberapa pencuci, di bawah Mandor | verifikasi setoran anggota, pantau tim dan progres bonus tim, absen sendiri, pendapatan sendiri |
| Mandor | **pemilik usaha jasa pencucian** yang menerima batch dari gudang SION | terima batch, jatah ke pencuci, penyiapan, QC dan verifikasi kartu kerja, bayar pencuci Borongan dari dananya sendiri, pendapatan sendiri |

Admin tidak memakai aplikasi (login Admin ditolak 403, pakai Web App).

Tujuan: setoran harian tercatat dengan foto bukti langsung dari lapangan, angka upah dan saldo sama
persis dengan Web App, dan pekerjaan tetap bisa dicatat saat sinyal hilang.

## 2. Peran dan navigasi

Bottom tab, **maksimal 5**, tanpa drawer. Tab ditentukan dari `GET /me` `role.code`
(`utils/navigation.ts`).

| Peran | Tab | Layar tumpuk yang dibuka dari tab |
|---|---|---|
| Pencuci | Beranda, Pendapatan, Riwayat, Profil | Absen, Ambil bahan, Serah hasil, Kerja ulang, Tarik dana, Detail hari Riwayat, Belum terkirim, Ganti password |
| Kepala Pencuci | Beranda, Tim, Pendapatan, Profil | Verifikasi tim, Detail pengajuan, Kartu Kerja tim, Batch tim, Progres bonus tim, Absen, Tarik dana |
| Mandor | Beranda, Batch, Verifikasi, Kartu Kerja, Akun | Terima batch, Penjatahan, Penyiapan, Detail pengajuan, Detail kartu dan QC, Anggota, Progres bonus tim, Pendapatan dan bonus, Tarik dana, Dana Mandor, Penarikan Borongan, Absen |

- Akun (Mandor) = ringkasan saldo, pintu ke Pendapatan, Tarik dana, Dana Mandor, Penarikan
  Borongan, lalu isi Profil.
- Label tab tidak pernah terpotong: ukuran huruf mengikuti besar huruf HP, label dua kata turun ke
  baris kedua, kalau tetap tidak muat ukurannya dikecilkan (diuji 360 dan 412 dp, 130%).
- Tab aktif ditandai pil emas di belakang ikon yang bergeser halus antar tab; efek tekan terbatas
  di dalam pil. Tab dipasang saat pertama dibuka dan tab tidak aktif dibekukan (`lazy`,
  `freezeOnBlur`), begitu pula layar di bawah tumpukan.
- Header v2 terang: Beranda = avatar kecil, sapaan (13, redup), nama (17 semibold), tanggal dan
  peran/tim (13); layar lain = judul 18. Lonceng di
  kanan semua layar utama dengan badge belum dibaca (`GET /me/notifications/unread-count` tiap 60
  detik saat terbuka, saat layar fokus, saat aplikasi aktif). Ketuk = layar Notifikasi: terbaru di
  atas dikelompokkan per hari (Hari ini, Kemarin, tanggal), ikon per jenis, belum dibaca ditandai
  (latar, huruf tebal, titik emas), 20 per halaman dengan Muat lebih banyak, tarik untuk menyegarkan,
  diambil ulang setiap dibuka. Ketuk = tandai dibaca seketika (badge ikut berkurang) lalu buka
  `target.screen`/`target.id`; `target` kosong (notifikasi lama dari web) = hanya ditandai dibaca. `jatah_dari_gudang` (`target.screen` = `rations`) membuka tab Batch > Penjatahan (Mandor) atau Batch tim (Kepala) dan menyorot jatah `data.batch_assignment_id` (batch-nya naik ke atas, jatahnya berlatar emas).
  Tandai semua dibaca. Push notification belum (fase berikutnya).
- Aksi utama melayang di kanan bawah, hanya di Beranda: Pencuci = langkah berikutnya (Ambil bahan /
  Serah hasil), Mandor = Terima batch bila ada batch masuk. Mengecil menjadi ikon saat isi digulir
  ke bawah; isi diberi ruang bawah setinggi tombol.

### Modul dan feature flag (`utils/config.ts`)

| Saklar | Status | Alasan |
|---|---|---|
| Semua modul (`attendance`, `work`, `rework`, `weighing`, `history`, `earnings`, `dailyProfit`, `withdrawals`, `team`, `approvals`, `workCards`, `batches`, `rations`, `preparation`, `teamWithdrawals`, `containers`) | aktif | Endpoint 15C tersedia; `preparation` dan tambah baris kartu kerja aktif lagi karena `GET /items` sudah ada |
| `flags.kepalaWashing` | **mati** | Klien belum memutuskan siapa yang menyetujui pengajuan Kepala dan bagaimana upahnya (API_MOBILE bagian 10). Saat mati: Kepala tidak punya ambil bahan, serah hasil, kerja ulang, dan **tab Riwayat disembunyikan** (isinya pasti kosong). Beranda Kepala memakai kartu Absen saya. |
| `dailyProfit` untuk Pencuci | mengikuti server | Disembunyikan bila `GET /me/daily-profit` 403 (Pengaturan "Tampilkan profit harian ke pencuci" mati) |
| Hubungi Admin | mengikuti server | Tampil hanya bila `/meta company.admin_whatsapp` terisi |

## 3. Alur per peran

Semua POST memakai `Idempotency-Key` (bagian 5). "Antrean" = aksi lewat antrean offline.

### Masuk dan sesi (semua peran)

1. `GET /meta` saat dibuka: versi minimum, jam server, pengaturan, company. Layar masuk mengambil
   ulang bila `company` belum ada.
2. Masuk: email atau nomor HP + password, `POST /auth/login` (`device_name` = nama perangkat).
   Error 422 tampil di isian; 403 Admin/nonaktif; 429 tampil sisa detik tunggu. Isian selalu kosong
   saat dibuka (tidak pernah diisi akun contoh); placeholder contoh redup "nama@email.com atau 08xx".
   Keyboard muncul: layar mengecil (Android `softwareKeyboardLayoutMode: resize`, iOS
   KeyboardAvoidingView), form bisa digulir dan digulir otomatis supaya tombol Masuk terlihat.
   Logo dan form muncul halus sekali saat layar dibuka (diam bila "Kurangi gerak").
3. Token di SecureStore (web: hanya memori, muat ulang = keluar). 401 di mana pun = keluar ke
   layar masuk dengan pesan "Sesi Anda berakhir".
4. Lupa password: tombol Hubungi Admin membuka WhatsApp ke `company.admin_whatsapp` dengan pesan
   "Halo Admin, saya <email/no HP yang diketik> lupa password aplikasi SION.". Tanpa nomor: pesan
   untuk menghubungi Admin langsung. Alamat API tidak tampil di layar (cek dengan
   `npm run dev:lan:info` atau `npm run dev:config:public`). Build pengembangan: galat koneksi
   menambahkan alamat yang dicoba dan penyebabnya (connection refused, timeout, CORS; di web CORS
   dibedakan dengan permintaan `no-cors`); build rilis hanya pesan ramah.
5. Keluar: `POST /auth/logout`; bila masih ada aksi belum terkirim, pengguna diperingatkan.

### Pencuci

| Langkah | Layar | Endpoint | Aturan |
|---|---|---|---|
| Absen masuk | Beranda > Absen masuk (kamera depan) | `POST /attendance/check-in` (antrean) | Selfie wajib; lokasi opsional (luar radius tetap diterima, ditandai). Jam = jam server. 409 = sudah absen, dianggap selesai. Lokasi: lihat aturan Lokasi absen di bagian 5. |
| Ambil bahan | pilih jatah > foto timbangan > isi gram dan pcs > periksa > kirim | `GET /me/rations`, `POST /work/take-material` (antrean) | Gram wajib, > 0, <= `remaining_gram` (ditolak langsung di isian). Pcs opsional, bilangan bulat. Foto wajib. Boleh ambil lagi setelah pengajuan pertama. |
| Serah hasil lembab | Beranda > Serah hasil | `POST /work/hand-over-damp` (antrean) | Hanya setelah ada bahan yang **disetujui** hari itu. Pcs wajib >= 1, foto wajib, gram tidak diminta. |
| Kerja ulang | Beranda > Ambil/Serah kerja ulang | `GET /me/rework`, `POST /work/take-rework`, `POST /work/hand-over-rework` (antrean) | Ambil: foto opsional, pcs bawaan dari kerja ulang. Serah: hanya setelah diambil, foto wajib. Selesai setelah kartu asal QC Standard. |
| Konfirmasi timbang | kartu di Beranda | `GET /me/weighings`, `POST /work-cards/{id}/weighing` (antrean) | Setuju, atau Tidak setuju dengan alasan >= 5 huruf. Sisa waktu sampai `deadline` ditampilkan. |
| Absen pulang | langkah terakhir, atau "Absen pulang sekarang" kapan saja setelah masuk | `POST /attendance/check-out` (antrean) | Sama dengan absen masuk. |
| Pendapatan | tab Pendapatan | `GET /me/earnings?week=`, `GET /me/balance`, `GET /me/daily-profit` | Pilih minggu (tidak boleh minggu depan). Per hari = accordion, satu terbuka, hari ini terbuka bawaan. |
| Tarik dana | Pendapatan/Beranda > Tarik dana | `GET /me/balance`, `GET /me/withdrawals`, `POST /me/withdrawals`, `POST /me/withdrawals/{id}/cancel` | Nominal >= `withdrawal.min_amount` dan <= saldo sumber dana; chip Tarik semua; satu pengajuan aktif; batal hanya selama Diajukan. |
| Riwayat | tab Riwayat | `GET /work/history?from&to` | 7/30/62 hari. Accordion satu terbuka (hari ini, atau hari terakhir bila hari ini kosong); rincian dan foto di layar detail. |

### Kepala Pencuci (`kepalaWashing` = false)

| Langkah | Endpoint | Aturan |
|---|---|---|
| Absen masuk/pulang sendiri | sama dengan Pencuci | Lewat kartu Absen saya |
| Beranda | `GET /approvals`, `GET /team`, `GET /work-cards?date=hari ini`, `GET /me/balance`, `GET /team/bonus-progress` | Ubin berangka: Menunggu verifikasi, Pencuci hadir hari ini (hadir/jumlah pencuci), Kartu belum QC hari ini, Saldo saya; ubin ditandai emas bila perlu tindakan. Lalu progres Anggota capai target dan kartu anggota. |
| Tim hari ini | `GET /team` | Absen, sisa jatah, kartu hari ini, jumlah pengajuan menunggu per anggota |
| Verifikasi | `GET /approvals?status=menunggu`, `GET /approvals/{id}`, `POST /approvals/{id}/approve`, `POST /approvals/{id}/reject` | Antrean berupa kartu ringkas yang dibuka di tempat (foto, batch, waktu, Setujui/Tolak/Buka detail). Detail menampilkan foto, sisa jatah sebelum pengajuan, kerja ulang. Setujui selalu lewat lembar konfirmasi; tolak wajib alasan >= 5 huruf. Pilih banyak untuk setujui/tolak sekaligus. Tidak ada geser untuk menyetujui. |
| Kartu Kerja tim dan QC | sama dengan Mandor | Bila diizinkan |
| Progres bonus tim | `GET /team/bonus-progress?week=` | Bonus Kepala (anggota capai dari aktif, PPE tim) dan per anggota (gram minggu ini vs target x 6, PPE bulan berjalan) |
| Pendapatan dan Tarik dana | sama dengan Pencuci | Data milik Kepala sendiri |

### Mandor

| Langkah | Endpoint | Aturan |
|---|---|---|
| Beranda | `GET /team`, `/approvals`, `/work-cards?date`, `/batches/incoming`, `/team/withdrawals?status=diajukan` | Angka yang perlu tindakan diberi aksen emas |
| Terima batch | `GET /batches/incoming`, `GET /containers/{kode}` (scan QR wadah), `POST /batches/{id}/receive` (antrean, multipart) | Gram diterima <= gram kirim. Ada selisih = catatan wajib >= 5 huruf. Dengan wadah: gram = bruto - tara; tara berbeda dari wadah wajib alasan. Foto opsional. |
| Penjatahan | `GET /rations`, `POST /rations` | Pencuci anggota tim, target > 0, tidak dobel, total <= `remaining_gram` Revisi 22/10: hanya stok G1 (`ready_for_ration` = true) yang bisa dijatah; batch `needs_preparation` atau `ready_for_ration` = false menampilkan badge "Perlu Penyiapan" dan tombol "Siapkan dulu" (membuka Penyiapan), tanpa tombol Buat penjatahan; server lama tanpa field itu dianggap siap. 422 `code` = `grade_not_ready`: pesan server + tombol "Siapkan dulu", bukan galat umum. Grade tampil di kartu batch, stok, dan jatah pencuci. Jatah dengan `executor_role` = gudang diberi penanda "Dari Gudang". Batch campuran: API hanya mengirim satu `grade` per batch (bukan per bagian), jadi pemilihan bagian G1 dilakukan server lewat `ready_for_ration`. Jatah G2/G3 lama tetap bisa diambil pencuci sampai selesai (J4). |
| Penyiapan | `GET /items?crushed=1` (item susut hancur: Pecahan, Bulu/Sesetan), `POST /batches/{id}/preparation` lewat antrean offline (`prepare_batch`, JSON, Idempotency-Key, satu per batch) | Hanya batch `can_prepare` (semua batch yang belum G1). Bentuk revisi 22/10: `g1_gram` (wajib, > 0) + `g1_pcs` + `crushed[]` (item + gram + pcs, boleh kosong, tambah/hapus baris); proses kering/basah tetap wajib. Hilang = masuk - G1 - hancur dihitung langsung di layar ("Hilang −120 gr (−4,0%)", "Hancur 80 gr (2,7%)"). Validasi di HP: G1 + hancur <= gram masuk, tidak ada angka negatif; pesan di bawah isian. Konfirmasi lewat bottom sheet berisi G1, hancur, hilang. Setelah terkirim: ringkasan (kode stok batch baru dan stok hancur, pelaksana = executor_role + nama). Baris Susut menampilkan "Isi gram G1 dulu" sampai G1 diisi (bukan "Hilang −100%"). Respons `crushed[].item` dari server berbentuk `{id, name}` (docs menulis string); aplikasi menerima keduanya. Hanya G1 menjadi batch `{kode}-P1`; batch asal Selesai. Item hancur: `?crushed=1` dari server (bertanda `is_crushed_item`; baris dengan item tak bertanda ditolak 422). Server lama yang mengabaikan filter: saring `is_crushed_item`, lalu grup hasil "hancur". Tidak ada cetak label (J5). |
| Tampilan susut dan sisa | komponen `Susut` (`components/elements/Susut`) | Satu format di mana pun susut tampil: "Hancur X gr (Y%) · Hilang −X gr (−Y%)" (minus U+2212; persen hilang dari server bila ada, selain itu dihitung dari gram kirim/masuk dengan satu desimal). Data lama yang hanya punya satu angka susut (`receipt_shrink_gram`) tampil sebagai Hilang. Dipakai di kartu batch (Penjatahan), ringkasan Terima batch, dan Penyiapan. Kartu kerja belum punya field susut di API_MOBILE, jadi belum ada yang ditampilkan di sana. Kartu jatah pencuci menampilkan sisa gram jatah ("Sisa jatah"). Aplikasi tidak mencetak label; stok baru hanya ditampilkan kode dan gramnya. |
| Verifikasi | sama dengan Kepala | |
| Kartu Kerja dan QC | `GET /work-cards` (per tanggal, atau Semua berhalaman, terbaru dulu), `GET /work-cards/{id}`, `GET /items?purpose=kartu_kerja`, `POST /work-cards/{id}/qc`, `POST /work-cards/{id}/verify` | Standard wajib gram bersih semua baris; Belum Standard wajib tanggal kerja ulang. Baris hasil bisa ditambah dari daftar item. Simpan hasil berubah = konfirmasi timbang kembali Menunggu. Verifikasi nonaktif selama konfirmasi Menunggu/Tidak Setuju. |
| Penarikan Borongan | `GET /team/withdrawals`, `POST .../approve`, `.../reject` (alasan >= 5), `.../pay` (tunai/transfer, foto bukti opsional) | Dana Mandor, tidak masuk Buku Kas SION |
| Dana Mandor | `GET /mandor/funds` | Saldo per pencuci Borongan, THR ditahan, pengajuan aktif |
| Pendapatan sendiri | sama dengan Pencuci | Lewat tab Akun |

## 4. Aturan bisnis yang ditampilkan

Semua dihitung server (API_MOBILE bagian 6 dan 7). Aplikasi menampilkan nilai dan status apa adanya.

| Hal | Yang dilihat pengguna |
|---|---|
| Upah per kartu | Tertahan (belum QC Standard, belum diverifikasi, atau timbang belum dikonfirmasi), Belum Dihitung (perkiraan), Sudah Dihitung (masuk saldo). Upah tidak bisa dihitung = alasan, bukan Rp 0. |
| Gaji harian | hari Hadir/Telat x gaji harian kontrak, masuk saldo setelah minggu selesai |
| Bonus mingguan | Pencuci: capai bila gram bahan disetujui >= target per hari x 6. Kepala: capai bila semua anggota aktif capai. Selama berjalan = Menunggu dengan progres. |
| Bonus bulanan | setelah bulan selesai; capai bila PPE > 0 dan data lengkap. Kepala: semua anggota PPE > 0. |
| PPE | nilai jual hasil - biaya tenaga kerja - gram bahan x Harga Target (Tahap 15B) |
| THR | persen THR (bawaan 8%) x penghasilan yang sudah menjadi hak, masuk THR Ditahan, dilepas pada tanggal THR tahunan |
| Konfirmasi timbang | setelah hasil standar disimpan, pencuci punya `weighing_confirm_hours` (bawaan **24 jam**); tanpa jawaban = Otomatis setuju. Selama Menunggu/Tidak Setuju upah tertahan dan kartu tidak bisa diverifikasi. |
| Penarikan | Dana SION (Mandiri, Mandor): diproses Admin di web. Dana Mandor (Borongan): diproses Mandor di aplikasi, saldo dari `mandor_funds`. Status Diajukan > Disetujui > Dibayar, atau Ditolak/Dibatalkan. |
| Saldo | Dapat Dicairkan, Bonus Pending, THR Ditahan (nama sesuai glosarium web) |

## 5. Aturan non-fungsional

| Hal | Aturan |
|---|---|
| Offline | Aksi lapangan (absen, ambil bahan, serah hasil, kerja ulang, konfirmasi timbang, terima batch) disimpan dulu di antrean (AsyncStorage + foto di folder dokumen), tampil "Belum terkirim", dikirim otomatis saat sinyal kembali, saat aplikasi aktif, dan tiap 60 detik. Hanya dikirim milik pengguna yang masuk. Ditolak server (4xx) = dikembalikan ke form. |
| Idempotency-Key | Antrean: key = id aksi, sama di setiap kiriman ulang. Aksi online (RTK Query): key per aksi, dipakai ulang bila kiriman tidak terjawab, baru setelah server menjawab. Teruji: jawaban pertama hilang, kiriman ulang dijawab `Idempotency-Replayed`, data tercatat sekali. |
| Foto | Kompres di HP: sisi terpanjang 1280 px, JPEG 0,7 (server maks 2 MB). Waktu foto diambil dikirim (`photo_taken_at`). URL foto dari server berlaku 15 menit dan memakai host API yang dipanggil aplikasi (bukan `APP_URL`). Data API yang lebih tua dari 10 menit dimuat ulang saat layar dibuka lagi supaya URL foto tidak kedaluwarsa (403). |
| Versi | `min_app_version` dari `/meta` lebih tinggi dari versi aplikasi = layar Perbarui aplikasi |
| Waktu | Asia/Jakarta untuk semua tanggal; jam absen = jam server |
| Tampilan | Terang (bawaan, ruang cuci terang), Gelap, Ikuti sistem; disimpan di AsyncStorage, berlaku tanpa restart. Semua warna dari `theme/tokens.json`; header navy di kedua mode, bilah status terang. |
| Aksesibilitas | Kontras AA kedua mode diuji (`theme/contrast.test.ts`): teks 4,5:1, garis isian dan fokus 3:1. Target sentuh >= 48 dp, tombol utama 56 dp di zona jempol. Label dan peran pembaca layar di semua tombol, isian, tab. Huruf ikut pengaturan HP. Animasi singkat dan mengikuti "kurangi gerak". |
| Huruf | Plus Jakarta Sans (4 ketebalan), angka tabular untuk rupiah dan gram; skala v2 (isi 15, kecil 13, judul 18/16, angka 24 s.d. 28); `maxFontSizeMultiplier` 1,3 |
| Isian | Satu komponen: garis 1 px, fokus emas 2 px, error merah + pesan di bawah, tinggi 52 dp, label di atas, bantuan di bawah, satuan di dalam isian, tanpa outline kedua (web/Android) |
| Format angka | Rupiah `Rp 30.000`, desimal hanya bila ada sen. Gram `1.250,5 gr`, desimal hanya bila tidak bulat. MoneyInput/GramInput: titik ribuan saat mengetik, koma desimal, tempelan berformat dibaca benar, nilai terkirim angka polos. "Rp" dan "gr" tidak pernah terpisah dari angka (spasi tak terputus). |
| Tata letak | Tombol yang menempel di bawah diukur, isi diberi ruang bawah setinggi tombol + safe area |
| Memuat dan menyegarkan | Semua layar daftar dan detail: tarik ke bawah untuk menyegarkan (lingkaran emas di atas permukaan kartu) memanggil refetch RTK Query. Muat pertama dan ganti tanggal/minggu/filter = kerangka berbentuk isi (daftar baris, hero + ubin, atau detail), bukan isi argumen sebelumnya. Saat menyegarkan isi lama tetap tampil. Gagal menyegarkan = pesan singkat di atas isi + Coba lagi, isi lama tidak dihapus; gagal tanpa data = layar galat + Coba lagi. |
| Daftar panjang | Daftar berhalaman (Notifikasi, Kartu Kerja "Semua") memakai FlashList: hanya baris terlihat yang dirender, halaman berikut dimuat saat mendekati dasar (tombol Muat lebih banyak tetap ada). Foto lewat expo-image dengan cache memori + disk. |
| Lokasi absen | Izin belum pernah diminta: penjelasan singkat + tombol Izinkan lokasi dulu, baru dialog sistem. Lokasi dibaca dengan akurasi seimbang, batas 10 detik, cadangan lokasi terakhir (maks. 2 menit), lalu dikirim bersama absen. Gagal = alasan jelas + satu tombol: izin ditolak (Izinkan lokasi, atau Buka Pengaturan bila tidak bisa diminta lagi), GPS mati (Nyalakan lokasi: dialog sistem Android), sinyal lemah (Coba lagi), pratinjau web (tidak tersedia). Kembali dari Pengaturan = diperiksa ulang. Absen selalu tetap bisa dikirim; tanpa koordinat server menandai Tanpa lokasi. Sebelum absen, "Di lokasi kerja / Di luar lokasi (± n m)" hanya bila `/me` mengirim koordinat dan radius lokasi kerja (belum dikirim; radius cadangan `settings.attendance_radius_m`). Setelah absen: tanda dan jarak dari server (`location_flag`, `distance_m`). |
| Uji | Jest + Testing Library, ESLint, TypeScript strict harus bersih sebelum commit (husky) |

Tangkapan revisi 22/10 (API asli `sion_wms_mobile` sesudah migrasi, 24/10/2026, 360 dp, gelap):
`docs/screenshots/r1022-360-dark-mandor-01-penjatahan.png` (Grade, Perlu Penyiapan, Hilang format
baru), `-02-g3-sudah-dijatah.png` (G3 yang sudah dijatah sebagian: tanpa tombol Siapkan dulu karena
`can_prepare` false), `-03-penjatahan-g1-form.png`. Penyiapan dan sorotan notifikasi belum
tertangkap: data demo tidak punya batch `can_prepare` atau notifikasi `jatah_dari_gudang`.

## 6. Backlog

- [CAKUPAN] Uji Android di HP fisik (Expo Go/APK preview) untuk semua alur, termasuk pembesaran
  huruf 130% di 360 dp. Sejauh ini Android hanya diuji sebagian di emulator; sisanya di pratinjau web.
  Daftar uji 14C-R2 di HP: (1) Masuk: keyboard muncul, form tergulir, tombol Masuk terlihat;
  Hubungi Admin membuka WhatsApp dengan isian. (2) Lonceng > Notifikasi > ketuk satu > pindah ke
  layar tujuan, badge berkurang. (3) Riwayat > Detail hari: accordion satu terbuka, halus.
  (4) Tarik ke bawah di Beranda/Tim/Kartu Kerja: lingkaran emas, isi lama tetap; mode pesawat lalu
  tarik: pita "Belum bisa menyegarkan" + Coba lagi. (5) Absen: penjelasan lokasi > Izinkan lokasi >
  dialog sistem; tolak > Izinkan lagi / Buka Pengaturan; matikan GPS > Nyalakan lokasi; di dalam
  gedung > Coba lagi; hasil "Di lokasi kerja"/"Di luar lokasi (± n m)". (6) Gulir cepat Kartu Kerja
  "Semua" dan Notifikasi: tidak patah-patah; tab pill bergeser halus.
- [CAKUPAN] Penyesuaian rumus PPE dan THR sesuai SOP klien. Dikerjakan di server; aplikasi hanya
  menampilkan, tidak perlu diubah selama bentuk respons tetap.
- [CAKUPAN] Baca angka timbangan dari foto (PRD v2 bagian 8.3 "Foto auto-read gram" dan bagian 11).
  Perlu keputusan cara: OCR di HP, di server, atau timbangan Bluetooth. Saat ini gram diketik
  pencuci dan dicocokkan Kepala/Mandor dengan foto.
- [PERLU KEPUTUSAN KLIEN] Kepala Pencuci ikut mencuci (`flags.kepalaWashing`): siapa yang
  menyetujui pengajuan Kepala (Mandor?) dan upah tingkat pencuci untuk Kepala. Setelah diputuskan
  dan server mendukung, nyalakan flag; tab Riwayat Kepala ikut muncul.
- [TAMBAHAN/FASE 2] Pembukuan Mandor penuh (escrow, invoice jasa, laba rugi Mandor).
- [TAMBAHAN/FASE 2] Settlement 3 nota.
- [TAMBAHAN/FASE 2] Push notification (token FCM sudah bisa didaftarkan lewat `POST /me/device-token`,
  pengiriman belum dibuat).
- Catatan API (bukan aplikasi): `GET /me` belum mengirim `location.latitude`, `location.longitude`,
  dan `location.radius_m`, jadi perkiraan di lokasi / di luar lokasi sebelum absen belum tampil
  (aplikasi sudah siap membacanya).
- Catatan API (bukan aplikasi): `/me/rework` tidak menandai pengajuan ambil kerja ulang yang masih
  menunggu, jadi tombol tetap tampil lalu ditolak 409; beberapa status dikirim dengan label = kode
  (`belum_dihitung`, `pending`), aplikasi memakai label dari tokens; pesan "Prepared at tidak boleh
  setelah today" belum berbahasa Indonesia penuh.

## 7. Keputusan dan asumsi

Keputusan yang sudah diambil:

- Navigasi bottom tab maksimal 5, tanpa drawer; Mandor punya tab Akun berisi Pendapatan dan Profil.
- Tampilan bawaan Terang; Gelap dan Ikuti sistem tersedia.
- Semua aksi lapangan offline-first lewat antrean; semua POST/PUT ber-Idempotency-Key.
- Aplikasi tidak menghitung uang; semua angka dari server.
- `.env.dev` = `http://127.0.0.1:8000/api/v1` (web) atau IP laptop (HP), Laravel dengan
  `DB_DATABASE=sion_wms_mobile`. `.env.prod` = server hosting, dipakai setelah server diperbarui
  ke 15B dan 15C; tidak membuat atau mengubah data di hosting saat pengembangan.
- Tab Riwayat Kepala disembunyikan selama `kepalaWashing` = false.
- Pratinjau web hanya untuk desain dan uji alur; target rilis Android.

Asumsi yang menunggu konfirmasi klien:

- Kepala Pencuci yang punya kontrak aktif dianggap ikut mencuci (asumsi server 15C); di aplikasi
  dimatikan sampai alur persetujuan dan upahnya diputuskan.
- Penarikan pencuci Borongan diproses Mandor dari dananya sendiri, versi ringan (tanpa escrow).
- Konfirmasi timbang otomatis setuju setelah batas jam (bawaan 24) tanpa jawaban.
- Absen di luar radius lokasi tetap diterima dan hanya ditandai.
- Pencuci boleh absen pulang tanpa serah hasil (mis. hari itu hanya kerja ulang).
