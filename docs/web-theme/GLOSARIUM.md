# Glosarium SION-WMS

Istilah yang dipakai di aplikasi (Tahap 13R). Definisi yang sama tampil sebagai ikon bantuan di samping istilah itu di layar. Sumber satu-satunya di kode: `App\Support\Glossary`; kalau definisi berubah, ubah keduanya (dijaga `GlossaryTest`).

| Istilah | Arti |
|---|---|
| **HPP** | Nilai modal stok dalam rupiah, dibawa dari harga beli nota ke setiap tahap berikutnya. |
| **Harga Jual** | Harga market tertinggi yang aktif, dari penjualan bahan baku atau harga market manual. |
| **Harga Beli Gudang** | Harga Jual dikurangi Biaya per Gram pos Gudang dan margin penjualan bahan baku; dipakai menilai sortir. |
| **Acuan Pengepul** | Harga Beli Gudang dikurangi Biaya per Gram pos Pengepul dan margin pengepul; hanya acuan. |
| **Harga Hasil** | Nilai per gram bahan per grade dari hasil cucinya, dari data cuci atau masukan Admin. |
| **Harga Bahan Pencuci** | Harga Hasil dikurangi Biaya per Gram pos Bahan Pencuci dan margin bahan pencuci; bobot pembagian HPP saat grading. |
| **Harga Produksi** | Rata-rata Harga Bahan Pencuci G1, G2, G3 dengan bobot 20, 50, dan 30 persen. |
| **Harga Target** | Harga Hasil dikurangi Biaya per Gram pos Bahan Bersih dan margin bahan bersih; rumus klien belum final. |
| **Pos Biaya** | Empat kelompok biaya (Pengepul, Gudang, Bahan Pencuci, Bahan Bersih) yang dibagi per gram untuk rantai harga. |
| **Biaya per Gram** | Kas keluar dan akrual satu pos dalam sebulan dibagi gram pembaginya; hasil bulan ini dipakai harga bulan depan. |
| **Grup Stok** | Pemilahan hasil sortir ke Retur, Jual, atau Grading, yang disetujui sebelum dipakai. |
| **Grading** | Proses membagi grup Grading menjadi baris G1, G2, G3 dan membagi ulang HPP-nya dengan bobot Harga Bahan Pencuci. |
| **SPK** | Tujuan satu baris hasil grading: Siap Produksi, Penyiapan, Jual, Cuci Langsung, atau Menunggu keputusan. |
| **Penyiapan** | Proses menyiapkan bahan sebelum dicuci; satu sumber dipakai utuh menjadi hasil utama dan sampingan. |
| **Batch** | Kumpulan bahan siap cuci yang diserahkan ke satu Mandor, nilainya jumlah HPP sumbernya. |
| **Penjatahan** | Bagian target gram satu batch untuk satu pencuci, dengan modal bahan yang dibekukan saat dibuat. |
| **Kartu Kerja** | Catatan harian satu pencuci: bahan keluar, hasil bersih, QC, dan verifikasi. |
| **Susut** | Selisih gram yang masuk dan gram yang keluar dari satu proses. |
| **Bonus Pending** | Bonus yang belum capai atau periodenya belum selesai; tercatat di saldo, belum bisa dicairkan. |
| **Saldo Dapat Dicairkan** | Upah yang sudah dihitung, gaji harian, bonus capai, dan THR yang dilepas, dikurangi penarikan. |

## Catatan pemakaian

- **Bonus Pending** adalah nama saldo dan tetap dipakai. Status satu bonus yang belum capai tampil **Menunggu**.
- Status hasil grading yang belum diputuskan tampil **Menunggu keputusan** (kode `pending`).
- Di layar istilah lama "OpCost/gr" ditulis **Biaya per Gram**.
