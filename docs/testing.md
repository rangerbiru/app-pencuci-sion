Kamu adalah QA tester untuk aplikasi gudang Laravel di http://127.0.0.1:8000. Tugasmu menguji 3 fitur baru lewat browser dan melaporkan hasilnya. JANGAN mengubah atau menghapus data lain di luar langkah yang disebutkan. Kalau sebuah langkah gagal atau tampilan tidak sesuai harapan, catat (screenshot + pesan error + isi console browser), lalu lanjut ke langkah berikutnya bila memungkinkan.

Akun:
- Admin: admin@sion.test / password
- Mandor: mandor@sion.test / password

Selama pengujian, cek console browser (DevTools) setelah setiap halaman dimuat dan setiap aksi; laporkan error JavaScript apa pun.

=== PERSIAPAN (login sebagai Admin) ===
P1. Buka /master/containers. Edit wadah "Kayu": isi "Berat Wadah Kosong (gr)" = 50, simpan. Edit "Kertas": isi 20, simpan. Biarkan "Kertas 2" kosong.
    Harapan: kolom "Berat Kosong" di daftar menampilkan "50 gr" dan "20 gr"; "Kertas 2" menampilkan "-".

=== SKENARIO A: Nota Pembelian + pilihan wadah (login Admin) ===
A1. Buka /gudang/purchase-notes/create. Isi Nomor Nota "UJI-WADAH-01", pilih supplier mana saja, tanggal hari ini.
A2. Pastikan ada 3 baris item (klik "+ Tambah Baris" bila perlu). Untuk tiap baris isi Item (pilih item mana saja yang sudah ada), Bruto, dan Harga/Unit:
    - Baris 1: Bruto 1000, Jenis Wadah "Kayu"
    - Baris 2: Bruto 2000, Jenis Wadah "Kertas"
    - Baris 3: Bruto 3000, Jenis Wadah "Kayu"
    Harapan: setelah memilih wadah, muncul input "Jumlah" berisi 1, dan kolom "Wadah (gr)" terisi otomatis: baris1 = 50.00, baris2 = 20.00, baris3 = 50.00. Kolom Netto ikut berubah.
A3. Ubah Jumlah di baris 3 menjadi 4. Harapan: Wadah (gr) baris 3 = 200.00.
A4. Ketik manual Wadah (gr) baris 1 menjadi 45. Harapan: angka 45 tetap (tidak ditimpa).
A5. Pilih wadah "Kertas 2" di baris 2. Harapan: muncul teks peringatan "Berat kosong belum diatur di Master Wadah, isi berat manual." dan Wadah (gr) baris 2 TIDAK berubah otomatis.
    Kembalikan baris 2 ke wadah "Kertas" (Wadah (gr) = 20.00).
A6. PENTING (uji bug yang baru diperbaiki): hapus BARIS 2 (baris tengah) dengan tombol hapus di baris itu.
    Harapan: tersisa 2 baris; baris yang tadinya baris 3 sekarang di posisi 2 dan TETAP menampilkan Item, wadah "Kayu", Jumlah 4, Wadah (gr) 200.00 — tampilan dropdown Item dan Jenis Wadah harus cocok dengan datanya, tidak tertukar dengan baris yang dihapus.
A7. Di baris posisi 2 (yang tadinya baris 3), ganti Jenis Wadah menjadi "Kertas". Harapan: Wadah (gr) baris itu langsung menjadi 80.00 (20 x 4). Kalau angkanya tidak berubah atau baris lain yang berubah, itu BUG.
A8. Klik "Simpan Nota". Harapan: diarahkan ke halaman detail nota; kolom "Wadah" menampilkan berat dan keterangan jenis wadah x jumlah (mis. "Kayu × 1", "Kertas × 4"); Netto = Bruto − Wadah − Tutup.
A9. Klik Edit pada nota itu. Harapan: wadah, jumlah, dan berat yang tersimpan muncul kembali dengan benar di tiap baris dan TIDAK berubah sendiri saat halaman dibuka. Klik Simpan tanpa mengubah apa pun, lalu pastikan data tetap sama.
A10. Uji error per baris: buka /gudang/purchase-notes/create lagi, isi nota "UJI-WADAH-02" dengan 1 baris tetapi kosongkan Bruto, lalu simpan (kalau browser mencegah submit karena field required, laporkan saja bahwa validasi browser berjalan).

=== SKENARIO B: Batch Gabungan (login Admin) ===
B1. Buka /gudang/production-batches. Pada tabel "Grading Siap Diterbitkan", cari grading dengan item "item 4" (sisa 300 gr). Klik "Split Stok", buat 1 split qty 100, simpan.
    Harapan: split baru berstatus "Belum Dipakai".
B2. Kembali ke /gudang/production-batches, klik "+ Batch Gabungan". Pilih Item "item 4", klik "Tampilkan Sumber".
    Harapan: muncul daftar sumber: grading item 4 (tersedia 200 gr, qty bisa diedit) dan split 100 gr ("Split dipakai utuh", qty tidak bisa diedit). Input qty yang belum dicentang tampak nonaktif.
B3. Centang kedua sumber. Harapan: teks ringkasan "Dipilih: 2 sumber, total 300 gr".
B4. Ubah qty grading menjadi 150. Harapan: total berubah menjadi 250.
B5. Uji validasi: ubah qty grading menjadi 999 lalu isi Kode Batch "UJI-GABUNG-01", pilih Mandor (akun Mandor di atas), klik "Terbitkan Batch Gabungan".
    Harapan: ditolak (validasi browser karena melebihi max, atau notifikasi error "melebihi sisanya"); tidak ada batch yang terbuat.
B6. Kembalikan qty grading ke 150, pastikan kedua sumber tercentang, Kode Batch "UJI-GABUNG-01", Mandor = akun Mandor di atas, lalu terbitkan.
    Harapan: diarahkan ke detail batch. Qty Batch = 250 gr, Item = "item 4". Bagian "Asal-usul Stok" menampilkan "Batch gabungan dari 2 sumber" dengan 2 baris lineage sampai ke Nota.
B7. Buka /gudang/production-batches. Harapan: batch UJI-GABUNG-01 muncul dengan label "Gabungan" dan item "item 4". Grading item 4 sekarang tersisa 50 gr.
B8. Buka halaman Split Stok grading item 4 (tombol "Split Stok" di tabel grading). Harapan: split yang dipakai berlabel "Sudah Jadi Batch" dengan tautan "UJI-GABUNG-01 (gabungan)"; klik tautannya harus membuka detail batch itu.
B9. Buka /gudang/production-batches/create?merge=1 lalu pilih item lain yang sumbernya kurang dari 2. Harapan: pesan bahwa item hanya punya kurang dari 2 sumber dan belum bisa digabung.

=== SKENARIO C: Upah dari hasil cuci pcs (Mandor, lalu Admin) ===
C1. Logout, login sebagai Mandor. Buka halaman Penjatahan untuk batch UJI-GABUNG-01 dan jatahkan ke satu Pencuci dengan target 250.
C2. Buka /gudang/wash-records, pilih penjatahan tadi, input hasil cuci: kosongkan "Hasil (gram)", isi "Hasil (pcs)" = 5, simpan.
C3. Buka /gudang/verifications dan setujui (approve) hasil cuci tadi.
C4. Logout, login sebagai Admin. Buka /gudang/wage-calculations/create. Pilih Pencuci tadi, periode mulai DAN akhir = tanggal hari ini, klik hitung.
    Harapan: upah = Rp 500.000,00 (5 pcs × Rp100.000 tarif upah item 4). Kalau hasilnya Rp0 atau Rp50.000.000-an, itu BUG.
C5. Di daftar /gudang/wage-calculations, pastikan judul kolom "Qty Tervalidasi (satuan dasar)" dan nilainya 5 (tanpa label "gr").
C6. Buka /master/prices. Harapan: harga upah item 4 tampil dengan akhiran "/ pcs".
C7. Buka /master/items. Periksa kolom Rasio Konversi: item pcs dengan rasio 1 (bila ada) harus menampilkan peringatan "Masih default, periksa berat 1 pcs".

=== LAPORAN ===
Buat tabel: ID langkah | Hasil (LULUS / GAGAL / TIDAK BISA DIUJI) | Catatan. Untuk setiap GAGAL sertakan: apa yang diharapkan, apa yang terjadi, screenshot, dan error console bila ada. Di akhir, tulis daftar data yang kamu buat selama pengujian (nomor nota, kode batch, split, hasil cuci, kalkulasi upah) supaya bisa dibersihkan.

Setelah pengujian
- Kirim laporannya ke sini, dan saya perbaiki kalau ada yang gagal.
- Data uji yang dibuat bisa dihapus manual, atau dikembalikan dari file backup tadi.
- Kalau Anda mau, saya juga bisa menjalankan pengujian ini sendiri dari sesi ini lewat Claude in Chrome, dengan langkah yang sama.

<!-- demo-mobile:start -->
## Akun demo aplikasi mobile (DemoMobileSeeder, database sion_wms_mobile)

Dibuat 08/10/2026 12:27. Password semua akun: `lI2XL3RQc918`

| Peran | Email | Nomor HP |
|---|---|---|
| admin | admin@mobile.demo | 081200001000 |
| mandor | mandor@mobile.demo | 081200001001 |
| kepala_pencuci | kepala@mobile.demo | 081200001002 |
| pencuci | siti@mobile.demo | 081200001003 |
| pencuci | rina@mobile.demo | 081200001004 |
| pencuci | dewi@mobile.demo | 081200001005 |
<!-- demo-mobile:end -->

## Akun panduan (docs/panduan)
PANDUAN_PASSWORD=eMpSiYR53_zL
