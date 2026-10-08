# API Mobile SION-WMS v1

Untuk aplikasi Pencuci, Kepala Pencuci, dan Mandor (Tahap 14C). API memakai service yang sama dengan Web App, jadi semua angka (HPP, upah, QC, saldo) sama persis dengan yang tampil di web.

## 1. Dasar

| Hal | Aturan |
|---|---|
| Alamat | `https://<domain>/api/v1` |
| Format | JSON. Kirim header `Accept: application/json`. |
| Login | Token Sanctum per perangkat. Kirim `Authorization: Bearer <token>`. |
| Peran | Hanya Pencuci, Kepala Pencuci, dan Mandor yang aktif. Admin ditolak. |
| Zona waktu | Asia/Jakarta. Semua waktu ISO 8601 dengan offset, mis. `2026-10-05T07:58:12+07:00`. Tanggal `YYYY-MM-DD`. |
| Uang dan gram | Selalu **string** desimal 2 angka, mis. `"6500000.00"`, `"250.00"`. Jangan diubah ke float untuk dihitung ulang. |
| Pcs | Bilangan bulat atau `null`. |
| Status | Objek `{ "code": "tertahan", "label": "Tertahan" }`. Pakai `code` untuk logika, `label` untuk tampilan. |
| Foto | `multipart/form-data`, JPEG/PNG/WebP, maksimal 2 MB (kompres di aplikasi dulu). URL foto di respons adalah URL bertanda tangan yang berlaku 15 menit. |
| Batas permintaan | Login 5 kali per menit per IP + identitas. Endpoint lain 120 per menit per user. |

### Bentuk respons

Sukses:

```json
{ "data": { ... } }
```

Daftar dipaginasi (`?page=2&per_page=20`, maksimal 100):

```json
{ "data": [ ... ], "meta": { "current_page": 2, "last_page": 5, "per_page": 20, "total": 93 } }
```

Error:

```json
{ "message": "Gram melebihi sisa jatah (120,00 gr).", "errors": { "weight": ["Gram melebihi sisa jatah (120,00 gr)."] } }
```

| Kode | Arti |
|---|---|
| 401 | Token tidak ada, dicabut, atau akun dinonaktifkan. Arahkan ke layar login. |
| 403 | Tidak punya akses (peran salah, data orang di luar tim). |
| 404 | Data tidak ditemukan. |
| 409 | Bentrok dengan keadaan data (mis. sudah absen masuk, sudah ada pengajuan penarikan aktif, pengajuan sudah diproses). |
| 422 | Isian tidak valid. `errors` berisi pesan per kolom; `message` = pesan pertama. |
| 429 | Terlalu banyak percobaan. Header `Retry-After` berisi detik tunggu. |

### Cakupan data per peran

| Peran | Boleh melihat | Boleh menyetujui |
|---|---|---|
| Pencuci | dirinya | - |
| Kepala Pencuci | dirinya + Pencuci di bawahnya | Pencuci di bawahnya |
| Mandor | dirinya + Kepala Pencuci di bawahnya + Pencuci timnya | Pencuci timnya |

Semua aksi tulis dicatat di Log Aktivitas web dengan sumber `mobile`.

## 2. Auth dan profil (Tahap 14A)

### GET /meta (tanpa login)

```json
{
  "data": {
    "api_version": "1.0",
    "min_app_version": "1.0.0",
    "server_time": "2026-10-05T07:58:12+07:00",
    "timezone": "Asia/Jakarta",
    "settings": {
      "photo_max_kb": 2048,
      "photo_types": ["image/jpeg", "image/png", "image/webp"],
      "attendance_radius_m": 100,
      "week_starts_on": "monday"
    }
  }
}
```

Kalau versi aplikasi lebih rendah dari `min_app_version`, minta pengguna memperbarui aplikasi.

### POST /auth/login

| Kolom | Isi |
|---|---|
| identifier | email atau nomor HP (format bebas: `0812...`, `+62 812...`) |
| password | password |
| device_name | nama perangkat, mis. `Samsung A15 (Siti)`. Login ulang dengan nama yang sama mengganti token lama perangkat itu. |

```json
{
  "data": {
    "token": "12|q2N...",
    "token_type": "Bearer",
    "user": { "...": "sama dengan GET /me" }
  }
}
```

Error: 422 `Email/nomor HP atau password salah.`; 403 `Akun Admin tidak bisa masuk ke aplikasi mobile. Gunakan Web App.`; 403 `Akun Anda nonaktif. Hubungi Admin.`; 429.

### POST /auth/logout

Mencabut token perangkat ini. Respons `{ "data": { "message": "Anda sudah keluar." } }`.

### GET /me

```json
{
  "data": {
    "id": 7,
    "name": "Siti",
    "email": "siti@sion.test",
    "phone": "081234567890",
    "role": { "code": "pencuci", "label": "Pencuci" },
    "photo_url": null,
    "kepala_pencuci": { "id": 5, "name": "Bu Kepala" },
    "mandor": { "id": 3, "name": "Pak Mandor" },
    "location": { "id": 1, "name": "BEST - Jasa Pencucian" },
    "contract": {
      "id": 4,
      "peran": "pencuci",
      "effective_date": "2026-01-01",
      "location": "BEST - Jasa Pencucian",
      "components": { "upah_bahan": true, "upah_hasil": true, "upah_qc": false }
    }
  }
}
```

### POST /me/password

`current_password`, `password` (minimal 8), `password_confirmation`. Perangkat lain dikeluarkan; perangkat ini tetap masuk.

### POST /me/device-token

`platform` (`android` atau `ios`), `token` (token FCM). 201 kalau baru, 200 kalau sudah terdaftar. Pengiriman notifikasi belum dibuat.

## 3. Absen (Tahap 14B)

Semua peran mobile bisa absen. Waktu absen = waktu server, bukan jam HP.

### GET /attendance/today

`data` = absen hari ini atau `null`.

```json
{
  "data": {
    "id": 31,
    "date": "2026-09-24",
    "status": { "code": "hadir", "label": "Hadir" },
    "source": { "code": "mobile_app", "label": "Mobile" },
    "location": "BEST - Jasa Pencucian",
    "check_in": {
      "at": "2026-09-24T08:00:00+07:00",
      "photo_url": "https://.../storage/mobile/absen/2026/09/....jpg?expires=...&signature=...",
      "photo_taken_at": "2026-09-24T07:59:41+07:00",
      "distance_m": 1112,
      "location_flag": { "code": "luar_lokasi", "label": "Luar Lokasi" }
    },
    "check_out": { "at": null, "photo_url": null, "photo_taken_at": null, "distance_m": null, "location_flag": null }
  }
}
```

### POST /attendance/check-in dan /attendance/check-out (multipart)

| Kolom | Isi |
|---|---|
| photo | selfie, wajib |
| photo_taken_at | waktu foto diambil di HP (ISO 8601), opsional |
| latitude, longitude | opsional, dikirim berpasangan |

- Absen di luar radius lokasi kerja **tetap diterima** dengan `location_flag` = `luar_lokasi`. Lokasi kerja tanpa koordinat atau HP tanpa lokasi: `tanpa_lokasi`.
- Radius per lokasi diatur Admin di Master Lokasi Kerja; kosong = `settings.attendance_radius_m` dari `/meta`.
- 409: sudah absen masuk, belum absen masuk (saat pulang), atau sudah absen pulang.
- Absen masuk ke Rekap Absensi web dengan sumber Mobile; Mandor tetap bisa mengoreksi.

## 4. Serah terima harian Pencuci (Tahap 14B)

Alurnya: ambil bahan dan serah hasil lembab **diajukan** Pencuci, lalu **disetujui** Kepala Pencuci atau Mandor (bagian 5). Stok jatah dan upah baru berubah setelah disetujui. Satu kartu kerja per pencuci per hari.

### GET /me/rations

```json
{
  "data": [
    {
      "batch_assignment_id": 12,
      "batch_code": "B-MOB",
      "item": "Bulu Berat",
      "target_gram": "40000.00",
      "taken_gram": "12500.00",
      "pending_gram": "500.00",
      "remaining_gram": "27000.00",
      "taken_pcs": 100,
      "status": { "code": "running", "label": "Berjalan" }
    }
  ]
}
```

`remaining_gram` = target - sudah masuk kartu - pengajuan yang masih menunggu. Jatah dihitung dalam gram; pcs hanya dicatat.

### POST /work/take-material (multipart, khusus Pencuci)

`batch_assignment_id`, `weight` (gram), `pcs` (opsional), `photo` (foto timbangan, wajib), `photo_taken_at` (opsional). 201 dengan objek pengajuan. 422 kalau gram melebihi sisa jatah: `Gram (10.000,01 gr) melebihi sisa jatah (10.000,00 gr). Kurangi gramnya.`

### POST /work/hand-over-damp (multipart, khusus Pencuci)

`pcs` (wajib, minimal 1), `photo` (wajib), `photo_taken_at` (opsional). Gram tidak diminta karena hasil masih basah. Disetujui = menambah `pcs_lembab` kartu hari itu; harus sudah ada bahan yang disetujui di hari yang sama.

### POST /work/submissions/{id}/cancel

Hanya pengajuan milik sendiri yang masih `menunggu`. Lainnya 409.

### Objek pengajuan

```json
{
  "id": 41,
  "type": { "code": "ambil_bahan", "label": "Ambil Bahan" },
  "status": { "code": "menunggu", "label": "Menunggu" },
  "work_date": "2026-09-24",
  "worker": { "id": 7, "name": "Siti" },
  "batch_assignment_id": 12,
  "batch_code": "B-MOB",
  "item": "Bulu Berat",
  "gram": "12500.00",
  "pcs": 100,
  "photo_url": "https://...signature=...",
  "photo_taken_at": "2026-09-24T07:55:00+07:00",
  "submitted_at": "2026-09-24T08:00:00+07:00",
  "decided_by": null,
  "decided_at": null,
  "reject_reason": null,
  "daily_work_card_id": null
}
```

Status: `menunggu`, `disetujui`, `ditolak` (lihat `reject_reason`), `dibatalkan`.

### GET /work/today dan GET /work/history?from=YYYY-MM-DD&to=YYYY-MM-DD

`history` bawaan 7 hari terakhir, paling lama 62 hari, hanya hari yang punya kartu atau pengajuan, terbaru dulu.

```json
{
  "data": {
    "date": "2026-09-24",
    "card": { "...": "objek kartu, bagian 5" },
    "submissions": [ { "...": "objek pengajuan" } ],
    "pending_count": 0
  }
}
```

## 5. Tim, approval, kartu kerja, dan QC (Tahap 14C, Kepala Pencuci dan Mandor)

### GET /team

Anggota tim (lihat tabel cakupan di bagian 1): `id`, `name`, `role`, `atasan`, `attendance_today` (status, jam masuk/pulang, tanda lokasi), `rations` (jatah dan sisa gram), `card_today` (status, gram bahan, gram hasil, pcs lembab), `pending_submissions`. Pencuci: 403.

### GET /approvals?status=menunggu&date=YYYY-MM-DD

Daftar pengajuan anggota tim yang boleh diputuskan, dipaginasi. `status` bawaan `menunggu`.

### POST /approvals/{id}/approve

Ambil bahan menjadi baris stok keluar di Kartu Kerja Harian tanggal itu (service yang sama dengan web: sisa jatah, satu kartu per hari, aturan tim). Serah lembab menambah `pcs_lembab`. 403 kalau bukan anggota tim; 409 kalau sudah diputuskan; 422 kalau aturan kartu menolak (mis. kartu sudah diverifikasi).

### POST /approvals/{id}/reject

`reason` wajib, minimal 5 karakter. Pengajuan kembali ke pencuci; stok dan upah tidak berubah.

### GET /work-cards?date=YYYY-MM-DD&worker={id}, GET /work-cards/{id}

Pencuci melihat kartunya sendiri; Kepala Pencuci dan Mandor kartu timnya. Dipaginasi.

```json
{
  "id": 88,
  "work_date": "2026-09-24",
  "worker": { "id": 7, "name": "Siti" },
  "location": "BEST - Jasa Pencucian",
  "status": { "code": "lolos_qc", "label": "Lolos QC" },
  "qc_status": { "code": "standard", "label": "Standard" },
  "rework_date": null,
  "verified": false,
  "verified_at": null,
  "verified_by": null,
  "material": { "gram": "12500.00", "pcs": 100, "rows": [ { "batch_assignment_id": 12, "batch_code": "B-MOB", "item": "Bulu Berat", "gram": "12500.00", "pcs": 100 } ] },
  "pcs_lembab": 240,
  "result": {
    "gram": "12156.00",
    "groups": [ { "group": "utuh", "gram": "8518.00", "pcs": 0 }, { "group": "kecil", "gram": "900.00", "pcs": 0 }, { "group": "hancur", "gram": "2220.00", "pcs": 0 }, { "group": "kotor", "gram": "518.00", "pcs": 0 } ],
    "rows": [ { "item_id": 21, "item": "PK2", "group": "utuh", "pcs_lembab": null, "gram": "8518.00", "pcs": null, "retur_tujuan": null } ]
  },
  "wage": {
    "status": { "code": "sudah_dihitung", "label": "Sudah Dihitung" },
    "amount": "31520200.00",
    "reason": null,
    "calculation_id": 5
  }
}
```

`wage` adalah bagian orang yang membuka (Pencuci: upahnya; Kepala/Mandor: bagiannya). Status upah: `tertahan` (kartu belum QC standard, belum diverifikasi, atau hasil timbangnya belum dikonfirmasi pencuci), `belum_dihitung` (tuntas, belum masuk Kalkulasi Upah), `sudah_dihitung`. Kalau upah tidak bisa dihitung, `amount` = `null` dan `reason` berisi alasannya (mis. `Kontrak belum ada`), tidak pernah `"0.00"`.

### POST /work-cards dan PUT /work-cards/{id}

Isian sama persis dengan form web: `pencuci_id`, `work_date` (tidak boleh masa depan), `work_location_id`, `notes`, `inputs[]` (`batch_assignment_id`, `weight`, `jumlah_keping`), `outputs[]` (`item_id`, `jumlah_keping_lembab`, `weight_clean`, `jumlah_keping_clean`, `retur_tujuan`, `retur_batch_id`), `qc_status`, `rework_date`. Pencuci: 403.

### POST /work-cards/{id}/qc

`qc_status` (`standard` atau `belum_standard`, wajib), `rework_date` (wajib kalau belum standard), `outputs[]` seperti di atas (hasil per item: gram dan pcs bersih). Stok keluar kartu tidak berubah. Lolos QC wajib mengisi gram hasil bersih semua baris.

### POST /work-cards/{id}/verify

Kartu lolos QC menjadi terverifikasi dan terkunci (sama dengan tombol Verifikasi di web).

## 6. Pendapatan, saldo, bonus, KPI, dan penarikan dana (Tahap 14D)

Berlaku untuk semua peran mobile; datanya selalu milik orang yang masuk.

### Aturan singkat

| Hal | Aturan |
|---|---|
| Periode gaji | Senin s.d. Minggu (Asia/Jakarta). Parameter minggu `YYYY-Www`, mis. `2026-W38`. |
| Skema | `paid_by.code` = `sion` (Mandor, atau kontrak Mandiri) atau `mandor` (kontrak Borongan). Pekerja Borongan tetap melihat pendapatannya, tetapi tidak punya saldo SION dan tidak bisa menarik dana: tampilkan "Dibayar Mandor". |
| Upah | Upah borongan bahan + hasil + QC. Status per kartu: `tertahan`, `belum_dihitung`, `sudah_dihitung`. Hanya yang Sudah Dihitung masuk saldo. |
| Gaji harian | Hari Hadir atau Telat x gaji harian kontrak. Masuk saldo setelah minggunya selesai. |
| Bonus mingguan | `capai` kalau minggu sudah selesai dan gram bahan yang diambil dan disetujui >= target gram per hari x 6; selain itu `pending` dengan progres. Kepala Pencuci (Tahap 15B): `capai` kalau semua anggota tim yang aktif minggu itu capai target; progres dalam jumlah anggota (`unit` = `anggota`). |
| Bonus bulanan | Dihitung setelah bulan selesai. `capai` kalau PPE > 0 dan datanya lengkap, `tidak_dibayar` kalau tidak. Sejak Tahap 15B PPE = nilai jual hasil - biaya tenaga kerja - gram bahan x Harga Target item-grade (lihat bagian 7). Kepala Pencuci: semua anggota tim PPE > 0. |
| THR | Persen THR (bawaan 8%) x penghasilan yang sudah menjadi hak, masuk THR Ditahan. Dilepas pada tanggal THR tahunan untuk tahun kontrak sebelumnya, atau seluruhnya kalau kontrak berakhir baik (pesangon). |
| Saldo | `dapat_dicairkan` = upah Sudah Dihitung + gaji harian + bonus capai + THR dilepas + koreksi Admin - penarikan. `pending` = akrual bonus berjalan + upah yang belum dihitung (perkiraan) + THR atas penghasilan yang belum dihitung. |

Status bonus (kode, label): `capai` Capai, `pending` Menunggu, `tidak_dibayar` Tidak Dibayar, `tidak_ada` Tidak Ada (kontrak tanpa bonus itu). Sejak Tahap 13R label `pending` adalah "Menunggu" (dulu "Pending"); kodenya tidak berubah, jadi aplikasi yang membaca `code` tidak terpengaruh. Nilai bonus berstatus Menunggu masuk saldo `pending` (Bonus Pending).

### GET /me/earnings?week=YYYY-Www

Bawaan minggu ini. 422 kalau format minggu salah.

```json
{
  "data": {
    "week": "2026-W38",
    "from": "2026-09-14",
    "to": "2026-09-20",
    "finished": true,
    "paid_by": { "code": "sion", "label": "Dibayar SION" },
    "present_days": 6,
    "material_gram": "250.00",
    "upah_bahan": "0.00",
    "upah_hasil": "0.00",
    "upah_qc": "0.00",
    "upah_by_status": { "tertahan": "0.00", "belum_dihitung": "0.00", "sudah_dihitung": "0.00" },
    "gaji_harian": "180000.00",
    "bonus_mingguan": { "status": { "code": "capai", "label": "Capai" }, "amount": "100000.00", "achieved_gram": "250.00", "target_gram": "240.00", "finished": true },
    "total": "280000.00",
    "days": [
      {
        "date": "2026-09-14",
        "attendance": { "code": "hadir", "label": "Hadir" },
        "present": true,
        "material_gram": "250.00",
        "material_pcs": 0,
        "pcs_lembab": 0,
        "result_gram": "0.00",
        "gaji_harian": "30000.00",
        "upah_sudah_dihitung": "0.00",
        "cards": [ { "id": 88, "worker": 7, "status": { "code": "draft", "label": "Draf" }, "wage": { "status": { "code": "tertahan", "label": "Tertahan" }, "amount": "0.00", "reason": null, "calculation_id": null } } ]
      }
    ]
  }
}
```

`total` = upah Sudah Dihitung + gaji harian + bonus mingguan yang capai.

### GET /me/balance

```json
{
  "data": {
    "paid_by": { "code": "sion", "label": "Dibayar SION" },
    "dapat_dicairkan": "280000.00",
    "pending": "100000.00",
    "thr_ditahan": "22400.00",
    "thr_by_contract_year": [ { "contract_year": 1, "amount": "22400.00" } ],
    "pending_items": [
      { "kind": "bonus_mingguan", "label": "Bonus mingguan 2026-W39", "amount": "100000.00", "status": { "code": "pending", "label": "Menunggu" }, "reason": null, "rule": null, "progress": { "achieved": "120.00", "target": "240.00" }, "daily_work_card_id": null },
      { "kind": "upah", "label": "Upah kartu 24/09/2026", "amount": "120000.00", "status": { "code": "tertahan", "label": "Tertahan" }, "reason": null, "rule": null, "progress": null, "daily_work_card_id": 91 }
    ],
    "ledger": [
      { "id": 12, "at": "2026-09-22T01:30:04+07:00", "bucket": { "code": "cair", "label": "Dapat Dicairkan" }, "kind": { "code": "gaji_harian", "label": "Gaji Harian" }, "amount": "180000.00", "period_start": "2026-09-14", "period_end": "2026-09-20", "contract_year": 1, "description": "Gaji harian 14/09/2026 s.d. 20/09/2026" }
    ],
    "withdrawal": { "can_withdraw": true, "min_amount": "50000.00", "active": null }
  }
}
```

`ledger` = 30 entri terbaru (riwayat upah, bonus, THR, penarikan). Nominal bertanda: minus = keluar. Saldo setelah penarikan = `dapat_dicairkan`.

### GET /me/bonuses

`weekly`: 8 minggu terakhir (terbaru dulu) dengan status, nominal, gram tercapai, dan target. `monthly`: 3 bulan terakhir dengan status, nominal, aturan (`10% dari laba` atau `nominal`), dan PPE.

### GET /me/kpi?month=YYYY-MM

`work_days`, `present_days`, `material_gram`, `gram_per_day` vs `target_gram_per_day`, `yield` (Utuh/Kecil/Hancur: gram, persen, target persen), `ppe` (nilai_jual, modal_bahan, upah, gaji_harian, bonus_mingguan, biaya_tenaga_kerja, ppe, cards), `monthly_bonus`.

### Penarikan dana

| Endpoint | Isi |
|---|---|
| GET /me/withdrawals | Riwayat, dipaginasi. |
| POST /me/withdrawals | `amount` (>= minimal di `balance.withdrawal.min_amount`, <= `dapat_dicairkan`), `notes` opsional. 201. 409 kalau masih ada pengajuan aktif. 422 kalau melebihi saldo atau di bawah minimal. 403 untuk skema Borongan. |
| POST /me/withdrawals/{id}/cancel | Hanya selama `diajukan`. |

Status: `diajukan` -> `disetujui` -> `dibayar`, atau `ditolak` (lihat `reject_reason`) / `dibatalkan`. Admin memproses di web; saat Dibayar, pengeluaran dicatat di Buku Kas dan saldo berkurang.

```json
{ "data": { "id": 5, "amount": "100000.00", "status": { "code": "diajukan", "label": "Diajukan" }, "notes": null, "method": null, "reject_reason": null, "requested_at": "2026-09-24T10:00:00+07:00", "approved_at": null, "paid_at": null, "rejected_at": null, "cancelled_at": null } }
```

## 7. Perubahan Tahap 15B (HRIS)

### Konfirmasi hasil timbang (A4)

Setelah Kepala Pencuci atau Mandor menyimpan hasil standar (QC `standard` dengan baris hasil), pencuci yang memakai aplikasi (punya token) diminta mengonfirmasi. Objek kartu kerja punya field baru:

```json
"weighing_confirmation": {
  "status": { "code": "menunggu", "label": "Menunggu" },
  "requested_at": "2026-09-24T10:00:00+07:00",
  "deadline": "2026-09-25T10:00:00+07:00",
  "answered_at": null,
  "reason": null
}
```

`null` kalau konfirmasi tidak diperlukan (kartu lama, atau pencuci belum memakai aplikasi). Status: `menunggu` Menunggu, `setuju` Disetujui, `tidak_setuju` Tidak Setuju, `otomatis` Otomatis (tanpa jawaban sampai `deadline`, batas jam di Pengaturan, bawaan 24). Selama `menunggu` atau `tidak_setuju`, POST /work-cards/{id}/verify ditolak 422 dan upah kartu `tertahan`. Kepala yang menyimpan ulang hasil (berubah) membuat status kembali `menunggu`.

| Endpoint | Isi |
|---|---|
| GET /me/weighings | Pencuci: kartu yang menunggu konfirmasinya (objek kartu kerja lengkap). |
| POST /work-cards/{id}/weighing | Pencuci pemilik kartu: `agree` (boolean, wajib), `reason` (wajib kalau `agree` = false, minimal 5 karakter). Mengembalikan objek kartu. 403 untuk bukan pencuci; 422 kalau kartu tidak sedang menunggu atau alasan kosong. |

### Profit harian (A5)

Per hari dari kartu yang hasil standarnya sudah diisi: `nilai_jual` hasil produksi, `hpp_bahan` (HPP stok keluar), `upah` (biaya tenaga kerja yang dibayar SION: Borongan = upah tingkat Mandor kartu, Mandiri = upah pencuci), `laba` = nilai jual - HPP - upah, `persen` = laba / (HPP + upah) x 100. `complete` = false kalau upah sebagian kartu belum bisa dihitung.

| Endpoint | Isi |
|---|---|
| GET /me/daily-profit?from=YYYY-MM-DD&to=YYYY-MM-DD | Bawaan 7 hari terakhir, paling panjang 62 hari. Pencuci: 403 kalau Admin mematikan "Tampilkan profit harian ke pencuci" di Pengaturan. |
| GET /team/daily-profit?from&to | Kepala Pencuci (anggota timnya) dan Mandor (pencuci timnya); tiap hari punya `members[]` dengan `user` dan angka yang sama. Pencuci: 403. |

```json
{
  "data": [
    { "date": "2026-09-23", "cards": 1, "nilai_jual": "9000000.00", "hpp_bahan": "5000000.00", "upah": "1700000.00", "laba": "2300000.00", "persen": "34.33", "complete": true }
  ],
  "meta": { "from": "2026-09-17", "to": "2026-09-23" }
}
```

### Bonus dan THR Menunggu (A1, A2, A3)

- `pending_items[]` di GET /me/balance: `amount` = nilai yang sudah terakrual sampai hari ini, `full_amount` = nominal penuh kalau capai. Bonus mingguan: hari hadir x bonus / 6, `progress` = `achieved`, `target`, `present_days` (bilangan bulat), `unit` (`gram` atau `anggota`). Bonus bulanan nominal: hari hadir x nominal / 24 (persen: persen x PPE berjalan), `progress` = `ppe`, `present_days`. Item baru `kind` = `thr`: persen THR x penghasilan yang belum dihitung, `progress.base` = dasar penghasilannya.
- GET /me/bonuses: `weekly[].unit` (`gram` atau `anggota`), `monthly[].complete`.
- GET /me/kpi: `ppe` sekarang berisi `nilai_jual`, `upah`, `gaji_harian`, `bonus_mingguan`, `biaya_tenaga_kerja`, `gram_bahan`, `nilai_target`, `modal_bahan` (informasi), `ppe`, `cards`.

## 8. Mandor dan Kepala Pencuci (Tahap 15B bagian B)

Semua endpoint di bagian ini khusus Kepala Pencuci dan Mandor (pencuci 403), kecuali kerja ulang (khusus pencuci). Mandor melihat batch yang diserahkan kepadanya; Kepala Pencuci melihat batch Mandor atasannya.

### Objek batch

```json
{
  "id": 14, "batch_code": "B-MB", "kode_stok": "BT261000014", "item": "Mangkok", "grades": [1, 2],
  "mandor": "Pak Mandor",
  "status": { "code": "received", "label": "Diterima" },
  "sent_gram": "6000.00", "nilai_hpp": "36000000.00",
  "received_at": "2026-10-07T09:00:00+07:00", "received_gram": "5900.00", "received_pcs": 480,
  "receipt_shrink_gram": "100.00", "receipt_notes": "Tercecer saat bongkar", "receipt_photo_url": "https://...",
  "remaining_gram": "5900.00", "can_prepare": false
}
```

Status batch: `assigned` Diserahkan (belum diterima), `received` Diterima, `in_progress` Berjalan, `completed` Selesai. `remaining_gram` = gram diterima - gram yang sudah dijatahkan.

### Batch masuk dan penerimaan (B1)

| Endpoint | Isi |
|---|---|
| GET /batches/incoming | Batch yang menunggu diterima. |
| POST /batches/{id}/receive (multipart) | `received_qty` (gram, wajib, tidak boleh melebihi gram kirim), `received_pcs`, `photo` (opsional), `receipt_notes` (wajib minimal 5 karakter kalau ada selisih). Selisih = susut penerimaan batch; nilai HPP batch tidak berubah dan dibagi ke gram diterima. 422 kalau sudah diterima. |

Penjatahan dari batch yang belum diterima ditolak (web maupun aplikasi).

### Penjatahan (B2)

| Endpoint | Isi |
|---|---|
| GET /rations | Batch yang sudah diterima (Diterima atau Berjalan) dengan `assignments[]` (`id`, `worker`, `target_gram`, `modal_bahan`, `status`). |
| POST /rations | `production_batch_id`, `lines[]` (`pencuci_id`, `target_qty`), validasi sama dengan web. Pencuci harus anggota tim; total tidak boleh melebihi `remaining_gram`. 201 dengan objek batch. |

### Penyiapan di rumah pencucian (B3)

POST /batches/{id}/preparation: `prepared_at`, `process_type` (`kering`/`basah`), `notes`, `outputs[]` (`item_id` bahan utama atau sampingan, `weight`, `jumlah_keping`). Hanya batch Cuci Langsung (semua sumber hasil grading G2/G3 ber-SPK Kirim Pencucian) yang sudah diterima dan belum dijatahkan (`can_prepare`). Dicatat lewat service penyiapan gudang (HPP batch dibagi ke hasil dengan aturan alokasi penyiapan, susut = masuk - hasil). Tiap hasil langsung menjadi batch baru `{kode}-P{n}` untuk Mandor yang sama, berstatus Diterima; batch asal menjadi Selesai. Respons 201: `preparation_id`, `input_gram`, `output_gram`, `susut_gram`, `batches[]`.

### Kerja ulang hasil belum standar (B4)

QC `belum_standard` (POST /work-cards/{id}/qc atau simpan kartu) membuat catatan kerja ulang milik pencuci. Isian tambahan opsional di kartu dan QC: `rework_pcs` (bawaan pcs lembab kartu) dan `rework_gram`.

| Endpoint | Isi |
|---|---|
| GET /me/rework | Pencuci: kerja ulang yang masih berjalan: `id`, `daily_work_card_id`, `card_date`, `rework_date`, `pcs`, `gram`, `status`, `taken_pcs`, `taken_at`, `returned_pcs`, `returned_at`. |
| POST /work/take-rework | Saat absen masuk: `rework_item_id`, `pcs`, `photo` opsional. Membuat pengajuan `ambil_kerja_ulang`. |
| POST /work/hand-over-rework (multipart) | Saat pulang: `rework_item_id`, `pcs`, `photo` wajib. Membuat pengajuan `serah_kerja_ulang`; hanya setelah kerja ulang diambil. |

Pengajuan kerja ulang disetujui lewat POST /approvals/{id}/approve yang sama (objek pengajuan punya `rework_item_id`). Status kerja ulang: `menunggu_diambil` Belum Diambil, `diambil` Diambil, `diserahkan` Diserahkan, `selesai` Selesai (kartu asal sudah QC standard), `dibatalkan`. Hasil kerja ulang masuk alur hasil standar kartu asal; upah dihitung setelah standar.

### Penarikan dari dana Mandor (B5, versi ringan)

Saldo pencuci skema Borongan dicatat dengan sumber dana Mandor. GET /me/balance punya `mandor_funds[]` (`mandor`, `dapat_dicairkan`, `thr_ditahan`); `dapat_dicairkan` utama tetap saldo SION. POST /me/withdrawals untuk pencuci Borongan membuat pengajuan dari dana Mandor-nya; objek penarikan punya `funded_by` (`sion` atau `mandor`, label "Mandor <nama>").

| Endpoint (Mandor) | Isi |
|---|---|
| GET /team/withdrawals?status= | Pengajuan dari dana Mandor ini, dipaginasi, dengan `worker`. |
| POST /team/withdrawals/{id}/approve | Setujui. |
| POST /team/withdrawals/{id}/reject | `reason` minimal 5 karakter. |
| POST /team/withdrawals/{id}/pay (multipart) | `method` (`tunai`/`transfer`), `proof` (foto bukti, opsional). Saldo pencuci berkurang; tidak masuk Buku Kas SION. |

Admin tidak memproses penarikan dari dana Mandor (403), dan Mandor tidak memproses penarikan dana SION. Keuangan Mandor penuh (escrow, invoice jasa, laba rugi Mandor) adalah fase 2.

## 9. Inventory Wadah (Tahap 15B bagian C)

### GET /containers/{kode} (Kepala Pencuci dan Mandor)

Hasil scan QR wadah (QR berisi URL `/wadah/{kode}`; ambil kodenya dari akhir URL). 404 kalau tidak ada.

```json
{ "data": { "kode": "WD00001", "jenis": { "code": "wadah", "label": "Wadah" }, "nama": "Box biru", "tara_gram": "350.00", "status": { "code": "aktif", "label": "Aktif" }, "usable": true, "isi_kode_stok": "SR261000012" } }
```

Hanya wadah `usable` (status aktif) yang boleh dipakai menimbang; rusak atau dibuang ditolak server.

### Isian wadah saat menimbang

POST /batches/{id}/receive menerima isian opsional `container[container_code]`, `container[container_tare]`, `container[tare_reason]`, `container[bruto]`. Tanpa `container_tare`, tara diambil dari wadah. Tara yang berbeda dari tara wadah, atau tara tanpa kode wadah, wajib `tare_reason` minimal 5 karakter. Gram diterima tetap dikirim di `received_qty` (aplikasi menghitung bruto - tara). Pemakaian wadah dicatat dan wadah menyimpan kode stok isinya.

