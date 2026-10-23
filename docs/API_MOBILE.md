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
| Kirim ulang aman | Header `Idempotency-Key` di setiap POST/PUT/PATCH berlogin (Tahap 15C, bagian 10). |
| CORS | Hanya untuk pratinjau web Expo (origin di `CORS_ALLOWED_ORIGINS`). Aplikasi native tidak butuh CORS; di production kosong. |

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
| 409 | Bentrok dengan keadaan data (mis. sudah absen masuk, sudah ada pengajuan penarikan aktif, pengajuan sudah diproses), atau `Idempotency-Key` dipakai untuk isian lain / masih diproses. |
| 422 | Isian tidak valid. `errors` berisi pesan per kolom; `message` = pesan pertama. Pesan selalu berbahasa Indonesia dan siap ditampilkan apa adanya: nama kolom diterjemahkan (`prepared_at` = "Tanggal penyiapan", `received_qty` = "Gram diterima", `outputs.*.weight` = "Gram hasil"), begitu juga kata tanggal relatif dan format (mis. `Tanggal penyiapan tidak boleh melebihi hari ini.`, `Format tanggal awal harus tahun-bulan-tanggal (mis. 2026-10-10).`). |
| 429 | Terlalu banyak percobaan. Header `Retry-After` berisi detik tunggu. |

Beberapa 422 juga membawa `code` (revisi 22/10) supaya aplikasi bisa memilih tindakan tanpa membaca pesan. Field ini tambahan, dan error tanpa `code` tetap seperti sebelumnya.

| `code` | Kapan |
|---|---|
| `grade_not_ready` | POST /rations dari batch yang belum G1: "Stok Grade 2/3 harus melalui Penyiapan dulu sebelum dijatahkan ke pencuci." Tampilkan tombol Penyiapan (POST /batches/{id}/preparation). |

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
      "week_starts_on": "monday",
      "...": "pengaturan Tahap 15C, lihat bagian 10"
    },
    "company": { "...": "lihat bagian 10" }
  }
}
```

Kalau versi aplikasi lebih rendah dari `min_app_version`, minta pengguna memperbarui aplikasi. Contoh respons lengkap: Lampiran A.

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
      "skema": "borongan",
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
      "status": { "code": "running", "label": "Berjalan" },
      "grade": 1,
      "ready_for_ration": true,
      "needs_preparation": false,
      "executor_role": "mandor"
    }
  ]
}
```

`remaining_gram` = target - sudah masuk kartu - pengajuan yang masih menunggu. Jatah dihitung dalam gram; pcs hanya dicatat. Revisi 22/10 (field tambahan): `grade`, `ready_for_ration`, `needs_preparation` dari batch jatah, dan `executor_role` (`gudang`/`mandor`). Jatah G2/G3 yang sudah terbuka sebelum revisi tetap bisa diambil sampai selesai (J4).

### POST /work/take-material (multipart, Pencuci; Kepala Pencuci dengan kontrak aktif, lihat bagian 10)

`batch_assignment_id`, `weight` (gram), `pcs` (opsional), `photo` (foto timbangan, wajib), `photo_taken_at` (opsional). 201 dengan objek pengajuan. 422 kalau gram melebihi sisa jatah: `Gram (10.000,01 gr) melebihi sisa jatah (10.000,00 gr). Kurangi gramnya.`

### POST /work/hand-over-damp (multipart, Pencuci; Kepala Pencuci dengan kontrak aktif, lihat bagian 10)

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

Anggota tim (lihat tabel cakupan di bagian 1): `id`, `name`, `role`, `atasan` (nama), `attendance_today` (atau `null`): `status`, `check_in`/`check_out` (jam `HH:MM`), `check_in_at`/`check_out_at` (ISO 8601, Tahap 15C), `location_flag`; `rations` (`batch_assignment_id`, `batch_code`, `remaining_gram`); `card_today` (kartu hari ini atau `null`: `id`, `status`, `material_gram`, `result_gram`, `pcs_lembab`), `pending_submissions` (jumlah). Pencuci: 403.

### GET /approvals?status=menunggu&date=YYYY-MM-DD

Daftar pengajuan anggota tim yang boleh diputuskan, dipaginasi. `status` bawaan `menunggu`. Detail satu pengajuan: GET /approvals/{id} (bagian 10).

### POST /approvals/{id}/approve

Ambil bahan menjadi baris stok keluar di Kartu Kerja Harian tanggal itu (service yang sama dengan web: sisa jatah, satu kartu per hari, aturan tim). Serah lembab menambah `pcs_lembab`. 403 kalau bukan anggota tim; 409 kalau sudah diputuskan; 422 kalau aturan kartu menolak (mis. kartu sudah diverifikasi).

### POST /approvals/{id}/reject

`reason` wajib, minimal 5 karakter. Pengajuan kembali ke pencuci; stok dan upah tidak berubah.

### GET /work-cards?date=YYYY-MM-DD&worker={id}, GET /work-cards/{id}

Pencuci melihat kartunya sendiri; Kepala Pencuci dan Mandor kartu timnya. Dipaginasi, terbaru dulu (`work_date` lalu `id` menurun). Tanpa `date` = semua kartu yang boleh dilihat (bukan hanya hari ini); kirim `date` untuk satu hari.

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
| Skema | `paid_by.code` = `sion` (Mandor, atau kontrak Mandiri) atau `mandor` (kontrak Borongan). Pekerja Borongan tidak punya saldo SION; saldonya dari dana Mandor (`mandor_funds` di GET /me/balance) dan penarikannya diproses Mandor (bagian 8, B5). Tampilkan "Dibayar Mandor". |
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
| POST /me/withdrawals | `amount` (>= minimal di `balance.withdrawal.min_amount`, <= saldo sumber dananya), `notes` opsional. 201. 409 kalau masih ada pengajuan aktif. 422 kalau melebihi saldo atau di bawah minimal. Skema Borongan: pengajuan dari dana Mandor (`funded_by.code` = `mandor`, saldo = `mandor_funds[].dapat_dicairkan`), diproses Mandor (bagian 8, B5); 403 hanya kalau Mandor pekerja itu tidak tercatat. |
| POST /me/withdrawals/{id}/cancel | Hanya selama `diajukan`. |

Status: `diajukan` -> `disetujui` -> `dibayar`, atau `ditolak` (lihat `reject_reason`) / `dibatalkan`. Dana SION diproses Admin di web; saat Dibayar, pengeluaran dicatat di Buku Kas dan saldo berkurang. Dana Mandor diproses Mandor di aplikasi, tanpa Buku Kas SION.

```json
{ "data": { "id": 5, "amount": "100000.00", "status": { "code": "diajukan", "label": "Diajukan" }, "notes": null, "method": null, "reject_reason": null, "funded_by": { "code": "sion", "label": "SION" }, "requested_at": "2026-09-24T10:00:00+07:00", "approved_at": null, "paid_at": null, "rejected_at": null, "cancelled_at": null } }
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
| POST /batches/{id}/receive (multipart) | `received_qty` (gram, wajib, tidak boleh melebihi gram kirim), `received_pcs`, `photo` (opsional), `receipt_notes` (wajib minimal 5 karakter kalau ada selisih). Revisi 22/10 Putaran 2 (tambahan, opsional): `crushed[]` (`item_id` bertanda susut hancur, `gram`, `pcs`) = susut hancur yang fisiknya ada, tidak boleh melebihi selisih; objek batch menambah `receipt_crushed_gram` dan `receipt_lost_gram` (negatif). Tidak ada label yang dicetak dari HP (J5). Selisih = susut penerimaan batch; nilai HPP batch tidak berubah dan dibagi ke gram diterima. 422 kalau sudah diterima. |

Penjatahan dari batch yang belum diterima ditolak (web maupun aplikasi).

### Penjatahan (B2)

| Endpoint | Isi |
|---|---|
| GET /rations | Batch yang sudah diterima (Diterima atau Berjalan) dengan `assignments[]` (`id`, `worker`, `target_gram`, `modal_bahan`, `status`, `executor_role`). |
| POST /rations | `production_batch_id`, `lines[]` (`pencuci_id`, `target_qty`), validasi sama dengan web. Pencuci harus anggota tim; total tidak boleh melebihi `remaining_gram`. 201 dengan objek batch. **Revisi 22/10:** hanya batch G1 (`ready_for_ration` = true); batch G2/G3 ditolak 422 `code` = `grade_not_ready`. |

**Revisi 22/10, field tambahan di objek batch** (GET /batches/incoming, GET /rations, POST /rations, `batches[]` penyiapan):

| Field | Isi |
|---|---|
| `grade` | `1` kalau semua sumber sudah G1 (hasil grading G1, grup lama G1, atau hasil penyiapan); selain itu grade tertinggi yang belum siap (`2`/`3`), atau `null` kalau tidak tertelusur. |
| `ready_for_ration` | `true` = boleh dijatahkan ke pencuci. |
| `needs_preparation` | Kebalikan `ready_for_ration`: tampilkan badge "Perlu Penyiapan" dan arahkan ke penyiapan. |

`assignments[].executor_role`: pelaksana penjatahan, `gudang` (Admin web) atau `mandor` (Mandor atau Kepala Pencuci), `null` untuk data yang tidak tertelusur. Jatah G2/G3 yang sudah terbuka sebelum revisi dibiarkan selesai (J4).

### Penyiapan di rumah pencucian (B3)

POST /batches/{id}/preparation: `prepared_at`, `process_type` (`kering`/`basah`), `notes`, `outputs[]` (`item_id` bahan utama atau sampingan, `weight`, `jumlah_keping`). Hanya batch Cuci Langsung (semua sumber hasil grading G2/G3 ber-SPK Kirim Pencucian) yang sudah diterima dan belum dijatahkan (`can_prepare`). Dicatat lewat service penyiapan gudang (HPP batch dibagi ke hasil dengan aturan alokasi penyiapan, susut = masuk - hasil). Tiap hasil langsung menjadi batch baru `{kode}-P{n}` untuk Mandor yang sama, berstatus Diterima; batch asal menjadi Selesai. Respons 201: `preparation_id`, `input_gram`, `output_gram`, `susut_gram`, `batches[]`.

**Revisi 22/10 (bentuk baru, disarankan):** kirim `g1_gram` (gram G1 hasil, ditimbang), `g1_item_id` (opsional, bawaan item batch), `g1_pcs`, dan `crushed[]` (susut hancur: `item_id`, `gram`, `pcs`; boleh kosong). `outputs[]` lama tetap diterima kalau `g1_gram` tidak dikirim. Penyiapan berlaku untuk **semua batch yang belum G1** (`can_prepare`), tidak lagi hanya Cuci Langsung. Aturannya:

- G1 + hancur tidak boleh melebihi gram masuk (gram diterima batch).
- Seluruh nilai HPP batch masuk ke G1 hasil, dan hanya G1 yang menjadi batch baru `{kode}-P1`, langsung siap dijatahkan.
- Tiap baris hancur menjadi stok sendiri (kode `PS`) di Grup Stok Jual dengan HPP 0. Item boleh tanpa harga.
- Susut hilang = masuk - G1 - hancur.

Respons 201 menambah field `g1_gram`, `crushed_gram`, `crushed[]` (`id`, `kode_stok`, `item`, `gram`), `lost_gram` (negatif, mis. `"-120.00"`), `lost_percent` (negatif, mis. `"-4.00"`), dan `executor_role`. Field lama (`input_gram`, `output_gram`, `susut_gram`, `batches[]`) tetap ada. Mandor di HP **tidak mencetak label** (J5); tampilkan kode stok dan gram di layar. Pengguna selain Mandor dan Kepala Pencuci tim batch itu: 403.

### Kerja ulang hasil belum standar (B4)

QC `belum_standard` (POST /work-cards/{id}/qc atau simpan kartu) membuat catatan kerja ulang milik pencuci. Isian tambahan opsional di kartu dan QC: `rework_pcs` (bawaan pcs lembab kartu) dan `rework_gram`.

| Endpoint | Isi |
|---|---|
| GET /me/rework | Pencuci: kerja ulang yang masih berjalan: `id`, `daily_work_card_id`, `card_date`, `rework_date`, `pcs`, `gram`, `status`, `taken_pcs`, `taken_at`, `returned_pcs`, `returned_at`, `pending_submission` (boolean: masih ada pengajuan ambil/serah kerja ulang ini yang menunggu verifikasi; sembunyikan tombol Ambil/Serah selama `true`, pengajuan kedua ditolak 422). Objek yang sama dipakai `rework` di GET /approvals/{id}. |
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

## 10. API pelengkap (Tahap 15C)

### Idempotency-Key

Semua POST, PUT, dan PATCH yang memakai token menerima header `Idempotency-Key` (1 sampai 100 karakter, mis. UUID). Buat satu key baru untuk setiap aksi pengguna, lalu pakai key yang sama kalau aksi itu dikirim ulang (sinyal putus, timeout, aplikasi ditutup).

| Keadaan | Hasil |
|---|---|
| Tanpa header | Berjalan seperti biasa. |
| Key baru | Dijalankan. Respons 2xx disimpan 24 jam per user. |
| Key sama + isian sama (method, path, isi, dan isi file foto) | Respons tersimpan dikembalikan tanpa menjalankan ulang, dengan header `Idempotency-Replayed: true`. |
| Key sama + isian atau endpoint beda | 409 `Idempotency-Key ini sudah dipakai untuk permintaan lain. Buat key baru untuk setiap aksi.` |
| Key sama, kiriman pertama masih berjalan | 409 `Permintaan dengan Idempotency-Key ini masih diproses. Tunggu sebentar lalu cek hasilnya.` |
| Kiriman pertama gagal (4xx/5xx) | Tidak disimpan: kiriman ulang dengan key yang sama dijalankan lagi (aksi yang gagal tidak mengubah data). |
| Key lebih dari 100 karakter | 422. |

POST /auth/login tidak memakai Idempotency-Key (belum ada user). Key disimpan per user, jadi key yang sama dari user lain tidak bentrok. Respons tersimpan dibuang setelah 24 jam (`model:prune` tiap hari 02.00).

### GET /items (Kepala Pencuci dan Mandor)

Daftar item aktif yang ringkas, untuk hasil Penyiapan dan baris hasil Kartu Kerja. Pencuci: 403. Dipaginasi, bawaan 100 per halaman (maksimal 200).

| Parameter | Isi |
|---|---|
| `purpose` | `penyiapan` (bahan baku + sampingan) atau `kartu_kerja` (hasil produksi + bahan kotor). |
| `jenis` | Satu atau beberapa jenis dipisah koma: `bahan_baku`, `hasil_produksi`, `sampingan`, `bahan_kotor`. 422 kalau jenis tidak dikenal. |
| `q` | Cari di nama atau kode. |

Isi per item: `id`, `kode`, `name`, `jenis` (`{code,label}`), `grup_hasil` (`utuh`/`kecil`/`hancur` untuk hasil produksi, selain itu `null`), `warna`, `unit`. **Item tidak punya grade**: grade melekat ke stok (hasil grading G1/G2/G3, batch), bukan ke item.

### GET /approvals/{id} (Kepala Pencuci dan Mandor)

Detail satu pengajuan anggota tim, status apa pun. Objek pengajuan (bagian 4) ditambah:

| Field | Isi |
|---|---|
| `photo` | `{ url, taken_at }`, URL bertanda tangan 15 menit. |
| `ration` | Untuk ambil bahan: `target_gram`, `taken_gram`, `pending_other_gram` (pengajuan lain yang menunggu), `remaining_gram` (sisa sebelum pengajuan ini). Lainnya `null`. |
| `rework` | Untuk pengajuan kerja ulang: objek kerja ulang (bagian 8, B4). Lainnya `null`. |
| `card` | Kartu kerja yang terbentuk setelah disetujui (objek kartu, bagian 5), atau `null`. |

403 kalau bukan anggota tim (termasuk Pencuci yang membuka pengajuannya sendiri: pakai GET /work/today atau /work/history). 404 kalau tidak ada.

### GET /team/bonus-progress?week=YYYY-Www&month=YYYY-MM (Kepala Pencuci dan Mandor)

Bawaan minggu dan bulan ini. Pencuci: 403. 422 kalau format minggu atau bulan salah.

- `members[]` (pencuci tim): `user`, `kepala_pencuci`, `paid_by`, `target_gram_per_day`, `weekly` (`status`, `amount`, `target_gram` = target x 6, `achieved_gram` = gram bahan disetujui minggu itu, `achieved` boolean, `finished`), `monthly` (`status`, `amount`, `ppe` berjalan, `cards`, `complete`, `notes`, `finished`). Angka sama dengan GET /me/bonuses milik pencuci itu.
- `kepala[]` (Kepala Pencuci itu sendiri; untuk Mandor semua Kepala di bawahnya): `weekly` (`members_achieved` dari `members_active`, capai kalau semua anggota aktif capai), `monthly` (`team_ppe`, `members`, `members_positive`, capai kalau semua anggota PPE > 0 dan lengkap).

### GET /mandor/funds (Mandor)

Saldo dana Mandor ini per pencuci Borongan (sesudah sinkron saldo, sama dengan `mandor_funds` di GET /me/balance pencuci itu). Kepala Pencuci dan Pencuci: 403.

- `workers[]`: `worker`, `in_team` (masih Borongan di tim Mandor ini; `false` = sudah pindah tetapi masih punya saldo), `dapat_dicairkan`, `thr_ditahan`, `withdrawal_active` (pengajuan Diajukan atau Disetujui).
- `total`: jumlah ketiga angka di atas dan `workers`.

### Tambahan di /meta (tanpa login)

`settings` sekarang juga berisi: `show_daily_profit` (boolean, Pengaturan "Tampilkan profit harian ke pencuci"; `false` = sembunyikan menu profit harian Pencuci), `weighing_confirm_hours` (batas jam konfirmasi timbang), `min_withdrawal` (string uang), `thr_percent`, `photo_url_minutes`, `work_days_per_week` (6), `monthly_accrual_days` (24), `history_max_days` (62), `per_page_max` (100), `idempotency_header`, `idempotency_ttl_hours`. Objek baru `company`: `name`, `phone`, `admin_whatsapp` (untuk tombol Hubungi Admin; `null` = sembunyikan).

### Field baru di respons lama

- GET /me: `contract.skema` (`borongan` atau `mandiri`).
- GET /team: `attendance_today.check_in_at` dan `check_out_at` (ISO 8601). `check_in`/`check_out` (`HH:MM`) tetap ada.

### Kepala Pencuci yang ikut mencuci (ASUMSI, perlu konfirmasi klien)

POST /work/take-material dan /work/hand-over-damp boleh untuk Kepala Pencuci yang **punya kontrak kerja aktif** (dianggap ikut mencuci). Tanpa kontrak, atau kontraknya sudah berakhir: 403 `Kepala Pencuci hanya bisa mengajukan kalau ikut mencuci dan punya kontrak kerja aktif. Minta Admin menambahkan kontrak kerja Anda.` Mandor tetap 403.

Batasan saat ini: penjatahan, Kartu Kerja Harian, dan approval masih hanya untuk peran Pencuci (aturan bisnis yang belum diubah). Jadi Kepala belum bisa menerima jatah, ambil bahan Kepala ditolak 422 (`Jatah ini bukan milik Anda.`), dan serah lembab Kepala belum bisa disetujui siapa pun. Alur lengkap menunggu keputusan klien: siapa yang menyetujui (Mandor?), dan upah tingkat pencuci untuk Kepala.

## 11. Notifikasi dalam aplikasi (Tahap 15D)

Notifikasi dibuat server saat kejadian terjadi dan disimpan per pengguna (tabel `notifications`, sama dengan lonceng di Web App; Mandor dan Kepala Pencuci melihat notifikasi yang sama di web). Belum ada push: aplikasi memanggil `GET /me/notifications/unread-count` saat dibuka dan berkala (mis. tiap 1 sampai 2 menit saat aplikasi aktif) untuk badge, lalu `GET /me/notifications` saat layar notifikasi dibuka.

Aturan:

- Hanya dikirim ke pengguna yang berhak melihat datanya (cakupan tim bagian 1). Akun nonaktif tidak menerima notifikasi.
- Satu kejadian tidak pernah dikirim dua kali ke orang yang sama (kunci kejadian unik per penerima), juga kalau aksi dikirim ulang.
- Notifikasi dibuat di dalam transaksi aksinya: aksi yang gagal tidak meninggalkan notifikasi.
- Notifikasi lebih dari 60 hari dihapus otomatis tiap hari pukul 02.00.

### Objek notifikasi

| Field | Isi |
|---|---|
| `id` | Id notifikasi. |
| `type` | `{code, label}`. `code` = jenis (tabel di bawah). |
| `title` | Judul singkat. |
| `body` | Isi satu kalimat, siap ditampilkan. |
| `created_at` | Waktu kejadian (ISO 8601). |
| `is_read`, `read_at` | Sudah dibaca dan waktunya (`null` kalau belum). |
| `target` | `{screen, id}` = layar yang dibuka saat notifikasi diketuk. `id` boleh `null` (layar daftar). `target` = `null` untuk notifikasi lama dari web: cukup tampilkan, tanpa tujuan. |
| `data` | Objek tambahan per jenis (boleh kosong `{}`), mis. `deadline_at` konfirmasi timbang. |

### Jenis notifikasi dan tujuan layar

| `type.code` | Penerima | Kejadian | `target.screen` | `target.id` | `data` |
|---|---|---|---|---|---|
| `pengajuan_baru` | Kepala Pencuci dan Mandor tim pencuci itu (pencuci tanpa Kepala: Mandor batch jatahnya) | Pencuci mengajukan ambil bahan, serah lembab, ambil kerja ulang, atau serah kerja ulang | `approval` (GET /approvals/{id}) | id pengajuan | `submission_type`, `worker_id` |
| `pengajuan_disetujui` | Pencuci yang mengajukan | Pengajuan disetujui (aplikasi atau web) | `work_today` (GET /work/today, /work/history); kerja ulang: `rework` | id pengajuan; kerja ulang: id kerja ulang | `submission_id`, `submission_type`, `work_date` |
| `pengajuan_ditolak` | Pencuci yang mengajukan | Pengajuan ditolak, alasan ada di `body` | sama dengan di atas | sama dengan di atas | sama dengan di atas |
| `timbang_menunggu` | Pencuci pemilik kartu | Hasil timbang menunggu konfirmasi | `weighing` (GET /me/weighings) | id kartu | `deadline_at` (lewat batas ini dianggap setuju), `work_date` |
| `timbang_ditolak` | Kepala Pencuci dan Mandor kartu itu | Pencuci tidak setuju dengan hasil timbang | `work_card` (GET /work-cards/{id}) | id kartu | `worker_id`, `work_date` |
| `kerja_ulang_baru` | Pencuci pemilik kartu | QC belum standar membuat kerja ulang | `rework` (GET /me/rework) | id kerja ulang | `daily_work_card_id` |
| `upah_dihitung` | Pencuci | Kalkulasi upah pencuci itu membayar minimal satu kartu | `earnings` (GET /me/earnings) | id kalkulasi upah | `period_start`, `period_end`, `cards` |
| `penarikan_diajukan` | Mandor pemilik dana | Pekerja Borongan mengajukan penarikan dari dana Mandor (dana SION diproses Admin di web, tanpa notifikasi) | `team_withdrawal` (GET /team/withdrawals) | id penarikan | `worker_id` |
| `penarikan_disetujui` | Pekerja pemilik penarikan | Penarikan disetujui | `withdrawal` (GET /me/withdrawals) | id penarikan | - |
| `penarikan_dibayar` | Pekerja pemilik penarikan | Penarikan dibayar | `withdrawal` | id penarikan | - |
| `penarikan_ditolak` | Pekerja pemilik penarikan | Penarikan ditolak, alasan ada di `body` | `withdrawal` | id penarikan | - |
| `bonus_capai` | Pekerja pemilik bonus | Bonus mingguan atau bulanan pertama kali tercatat capai di saldo (sinkron harian 01.30) | `bonuses` (GET /me/bonuses) | `null` | `kind` (`bonus_mingguan`/`bonus_bulanan`), `period_start`, `period_end` |
| `jatah_dari_gudang` | Mandor pencuci itu (dan Mandor batchnya) | Admin gudang menjatahkan langsung ke pencuci (revisi 22/10); upah tetap lewat Mandor | `rations` (GET /rations) | id batch | `batch_code`, `batch_assignment_id`, `pencuci` |
| `batch_masuk` | Mandor batch itu | Admin menerbitkan batch baru yang harus diterima (batch hasil penyiapan di rumah pencucian langsung Diterima, tanpa notifikasi) | `incoming_batch` (GET /batches/incoming) | id batch | `batch_code` |

Jenis lama dari web (`batch_assigned`, `assignment_reopened`) bisa muncul di daftar dengan `target` = `null`. Jenis yang belum dikenal aplikasi tampilkan dengan `title` dan `body` saja.

### GET /me/notifications?unread=1&page=1&per_page=20

Notifikasi milik pengguna, terbaru di atas, dipaginasi. `unread=1` = hanya yang belum dibaca.

### GET /me/notifications/unread-count

`{ "data": { "unread": 3 } }` untuk badge.

### POST /me/notifications/{id}/read

Tandai satu notifikasi dibaca, mengembalikan objek notifikasi. Sudah dibaca = tetap 200 (waktu baca tidak berubah). Notifikasi orang lain atau yang sudah dihapus = 404.

### POST /me/notifications/read-all

Tandai semua dibaca: `{ "data": { "updated": 4, "unread": 0 } }`.

### GET /meta tanpa login

`/meta` tetap bisa dipanggil tanpa token (layar login). `company.admin_whatsapp` = nomor WhatsApp Admin dari Pengaturan untuk tombol "Hubungi Admin"; `null` = sembunyikan tombolnya.

## Lampiran A. Contoh respons asli

Diambil dari respons server yang sebenarnya (database demo `sion_wms_mobile` dari `DemoMobileSeeder`, 08/10/2026), bukan ditulis tangan. Setiap permintaan dijalankan lalu dibatalkan (rollback), jadi data demo tidak berubah. Supaya ringkas, **setiap daftar dipotong menjadi paling banyak 2 baris pertama**; `meta.total` tetap jumlah aslinya. Token dan URL foto di contoh sudah tidak berlaku.

### GET /meta

Status 200.

```json
{
  "data": {
    "api_version": "1.0",
    "min_app_version": "1.0.0",
    "server_time": "2026-10-08T12:27:13+07:00",
    "timezone": "Asia/Jakarta",
    "settings": {
      "photo_max_kb": 2048,
      "photo_types": [
        "image/jpeg",
        "image/png"
      ],
      "photo_url_minutes": 15,
      "attendance_radius_m": 100,
      "week_starts_on": "monday",
      "show_daily_profit": true,
      "weighing_confirm_hours": 24,
      "min_withdrawal": "50000.00",
      "thr_percent": "8.00",
      "work_days_per_week": 6,
      "monthly_accrual_days": 24,
      "history_max_days": 62,
      "per_page_max": 100,
      "idempotency_header": "Idempotency-Key",
      "idempotency_ttl_hours": 24
    },
    "company": {
      "name": "PT. Sarang Natural Indonesia",
      "phone": null,
      "admin_whatsapp": "6281234567890"
    }
  }
}
```

### POST /auth/login

Status 200.

```json
{
  "data": {
    "token": "2|p2DaN2JtsJULhpvVTKTlxlzgu5qXQ3VUBwzUZxTf64ea0762",
    "token_type": "Bearer",
    "user": {
      "id": 4,
      "name": "Siti",
      "email": "siti@mobile.demo",
      "phone": "081200001003",
      "role": {
        "code": "pencuci",
        "label": "Pencuci"
      },
      "photo_url": null,
      "kepala_pencuci": {
        "id": 3,
        "name": "Bu Sari"
      },
      "mandor": {
        "id": 2,
        "name": "Pak Joko"
      },
      "location": {
        "id": 1,
        "name": "BEST - Jasa Pencucian"
      },
      "contract": {
        "id": 3,
        "peran": "pencuci",
        "skema": "borongan",
        "effective_date": "2026-08-09",
        "location": "BEST - Jasa Pencucian",
        "components": {
          "upah_bahan": true,
          "upah_hasil": true,
          "upah_qc": false
        }
      }
    }
  }
}
```

### POST /auth/logout

Status 200.

```json
{
  "data": {
    "message": "Anda sudah keluar."
  }
}
```

### GET /me (Pencuci Borongan)

Status 200.

```json
{
  "data": {
    "id": 4,
    "name": "Siti",
    "email": "siti@mobile.demo",
    "phone": "081200001003",
    "role": {
      "code": "pencuci",
      "label": "Pencuci"
    },
    "photo_url": null,
    "kepala_pencuci": {
      "id": 3,
      "name": "Bu Sari"
    },
    "mandor": {
      "id": 2,
      "name": "Pak Joko"
    },
    "location": {
      "id": 1,
      "name": "BEST - Jasa Pencucian"
    },
    "contract": {
      "id": 3,
      "peran": "pencuci",
      "skema": "borongan",
      "effective_date": "2026-08-09",
      "location": "BEST - Jasa Pencucian",
      "components": {
        "upah_bahan": true,
        "upah_hasil": true,
        "upah_qc": false
      }
    }
  }
}
```

### GET /me (Pencuci Mandiri)

Status 200.

```json
{
  "data": {
    "id": 5,
    "name": "Rina",
    "email": "rina@mobile.demo",
    "phone": "081200001004",
    "role": {
      "code": "pencuci",
      "label": "Pencuci"
    },
    "photo_url": null,
    "kepala_pencuci": {
      "id": 3,
      "name": "Bu Sari"
    },
    "mandor": {
      "id": 2,
      "name": "Pak Joko"
    },
    "location": {
      "id": 1,
      "name": "BEST - Jasa Pencucian"
    },
    "contract": {
      "id": 4,
      "peran": "pencuci",
      "skema": "mandiri",
      "effective_date": "2026-08-09",
      "location": "BEST - Jasa Pencucian",
      "components": {
        "upah_bahan": true,
        "upah_hasil": true,
        "upah_qc": false
      }
    }
  }
}
```

### GET /me (Kepala Pencuci)

Status 200.

```json
{
  "data": {
    "id": 3,
    "name": "Bu Sari",
    "email": "kepala@mobile.demo",
    "phone": "081200001002",
    "role": {
      "code": "kepala_pencuci",
      "label": "Kepala Pencuci"
    },
    "photo_url": null,
    "kepala_pencuci": null,
    "mandor": {
      "id": 2,
      "name": "Pak Joko"
    },
    "location": {
      "id": 1,
      "name": "BEST - Jasa Pencucian"
    },
    "contract": {
      "id": 2,
      "peran": "kepala_pencuci",
      "skema": "borongan",
      "effective_date": "2026-08-09",
      "location": "BEST - Jasa Pencucian",
      "components": {
        "upah_bahan": true,
        "upah_hasil": true,
        "upah_qc": true
      }
    }
  }
}
```

### GET /me (Mandor)

Status 200.

```json
{
  "data": {
    "id": 2,
    "name": "Pak Joko",
    "email": "mandor@mobile.demo",
    "phone": "081200001001",
    "role": {
      "code": "mandor",
      "label": "Mandor"
    },
    "photo_url": null,
    "kepala_pencuci": null,
    "mandor": null,
    "location": {
      "id": 1,
      "name": "BEST - Jasa Pencucian"
    },
    "contract": {
      "id": 1,
      "peran": "mandor",
      "skema": "borongan",
      "effective_date": "2026-08-09",
      "location": "BEST - Jasa Pencucian",
      "components": {
        "upah_bahan": true,
        "upah_hasil": true,
        "upah_qc": true
      }
    }
  }
}
```

### POST /me/password

Status 200.

```json
{
  "data": {
    "message": "Password sudah diganti. Perangkat lain perlu masuk lagi."
  }
}
```

### POST /me/device-token

Status 201.

```json
{
  "data": {
    "id": 1,
    "platform": "android"
  }
}
```

### GET /attendance/today

Status 200.

```json
{
  "data": {
    "id": 26,
    "date": "2026-10-08",
    "status": {
      "code": "hadir",
      "label": "Hadir"
    },
    "source": {
      "code": "manual_mandor",
      "label": "Mandor"
    },
    "location": null,
    "check_in": {
      "at": "2026-10-08T07:50:00+07:00",
      "photo_url": null,
      "photo_taken_at": null,
      "distance_m": null,
      "location_flag": null
    },
    "check_out": {
      "at": null,
      "photo_url": null,
      "photo_taken_at": null,
      "distance_m": null,
      "location_flag": null
    }
  }
}
```

### POST /attendance/check-in

Status 201.

```json
{
  "data": {
    "id": 29,
    "date": "2026-10-08",
    "status": {
      "code": "hadir",
      "label": "Hadir"
    },
    "source": {
      "code": "mobile_app",
      "label": "Mobile"
    },
    "location": "BEST - Jasa Pencucian",
    "check_in": {
      "at": "2026-10-08T12:27:14+07:00",
      "photo_url": "http://localhost/storage/mobile/absen/2026/10/d66bb24f-b8ea-46c7-afcf-686e89931036.jpg?expires=1791438135&signature=31ddb20a1e230330b97a041b50c799166e64d5c5c7988c202d073e5fdb914c91",
      "photo_taken_at": "2026-10-08T12:27:14+07:00",
      "distance_m": null,
      "location_flag": {
        "code": "tanpa_lokasi",
        "label": "Tanpa Lokasi"
      }
    },
    "check_out": {
      "at": null,
      "photo_url": null,
      "photo_taken_at": null,
      "distance_m": null,
      "location_flag": null
    }
  }
}
```

### POST /attendance/check-out

Status 200.

```json
{
  "data": {
    "id": 30,
    "date": "2026-10-08",
    "status": {
      "code": "hadir",
      "label": "Hadir"
    },
    "source": {
      "code": "mobile_app",
      "label": "Mobile"
    },
    "location": "BEST - Jasa Pencucian",
    "check_in": {
      "at": "2026-10-08T12:27:15+07:00",
      "photo_url": "http://localhost/storage/mobile/absen/2026/10/80404851-dbc9-433f-99a4-a8b6d1ecfa10.jpg?expires=1791438135&signature=65c61a89ed947f12b4ad90ae2165326b2d5550d74c5bf6b84ea9b9ba996507e5",
      "photo_taken_at": null,
      "distance_m": null,
      "location_flag": {
        "code": "tanpa_lokasi",
        "label": "Tanpa Lokasi"
      }
    },
    "check_out": {
      "at": "2026-10-08T12:27:15+07:00",
      "photo_url": "http://localhost/storage/mobile/absen/2026/10/0a89a2e2-6924-44d6-a097-804e5d41e2c2.jpg?expires=1791438135&signature=85ab528d7affdcb59d198b7d5c5e90e7483bd67ff63c7f1949ef7ee41dc06754",
      "photo_taken_at": null,
      "distance_m": null,
      "location_flag": {
        "code": "tanpa_lokasi",
        "label": "Tanpa Lokasi"
      }
    }
  }
}
```

### GET /me/rations

Status 200.

```json
{
  "data": [
    {
      "batch_assignment_id": 1,
      "batch_code": "B-MOB-01",
      "item": "Sudut Putih",
      "target_gram": "5000.00",
      "taken_gram": "3400.00",
      "pending_gram": "300.00",
      "remaining_gram": "1300.00",
      "taken_pcs": 422,
      "status": {
        "code": "pending",
        "label": "pending"
      }
    }
  ]
}
```

### POST /work/take-material

Status 201.

```json
{
  "data": {
    "id": 5,
    "type": {
      "code": "ambil_bahan",
      "label": "Ambil Bahan"
    },
    "status": {
      "code": "menunggu",
      "label": "Menunggu"
    },
    "work_date": "2026-10-08",
    "worker": {
      "id": 6,
      "name": "Dewi"
    },
    "batch_assignment_id": 3,
    "rework_item_id": null,
    "batch_code": "B-MOB-01",
    "item": "Sudut Putih",
    "gram": "350.00",
    "pcs": 44,
    "photo_url": "http://localhost/storage/mobile/ambil-bahan/2026/10/f54ab715-246b-4f51-8c23-cf06a98b7760.jpg?expires=1791438135&signature=09cb43e9d61127a86c0998979f25222beff58fffa42b0ca619f4b603e2fb1665",
    "photo_taken_at": "2026-10-08T12:27:15+07:00",
    "submitted_at": "2026-10-08T12:27:15+07:00",
    "decided_by": null,
    "decided_at": null,
    "reject_reason": null,
    "daily_work_card_id": null
  }
}
```

### POST /work/take-material (Idempotency-Key, kiriman ulang)

Status 201, header Idempotency-Replayed: true.

```json
{
  "data": {
    "id": 6,
    "type": {
      "code": "ambil_bahan",
      "label": "Ambil Bahan"
    },
    "status": {
      "code": "menunggu",
      "label": "Menunggu"
    },
    "work_date": "2026-10-08",
    "worker": {
      "id": 6,
      "name": "Dewi"
    },
    "batch_assignment_id": 3,
    "rework_item_id": null,
    "batch_code": "B-MOB-01",
    "item": "Sudut Putih",
    "gram": "350.00",
    "pcs": 44,
    "photo_url": "http://localhost/storage/mobile/ambil-bahan/2026/10/2944f3ab-b4ba-49ca-8070-71facabbe525.jpg?expires=1791438135&signature=769248b99d35084128f1e15399057df0b323b979c59558d47984b6a31d2469bd",
    "photo_taken_at": null,
    "submitted_at": "2026-10-08T12:27:15+07:00",
    "decided_by": null,
    "decided_at": null,
    "reject_reason": null,
    "daily_work_card_id": null
  }
}
```

### POST /work/take-material (Idempotency-Key sama, isian beda)

Status 409.

```json
{
  "message": "Idempotency-Key ini sudah dipakai untuk permintaan lain. Buat key baru untuk setiap aksi."
}
```

### POST /work/take-material (Kepala tanpa kontrak)

Status 403.

```json
{
  "message": "Kepala Pencuci hanya bisa mengajukan kalau ikut mencuci dan punya kontrak kerja aktif. Minta Admin menambahkan kontrak kerja Anda."
}
```

### POST /work/hand-over-damp

Status 201.

```json
{
  "data": {
    "id": 8,
    "type": {
      "code": "serah_lembab",
      "label": "Serah Lembab"
    },
    "status": {
      "code": "menunggu",
      "label": "Menunggu"
    },
    "work_date": "2026-10-08",
    "worker": {
      "id": 4,
      "name": "Siti"
    },
    "batch_assignment_id": null,
    "rework_item_id": null,
    "batch_code": null,
    "item": null,
    "gram": null,
    "pcs": 48,
    "photo_url": "http://localhost/storage/mobile/hasil-lembab/2026/10/091ef8c5-3f0c-46f9-9908-0a52a8f0259c.jpg?expires=1791438135&signature=45648b0f8bc7901800743d28dc297c54b2d1e3fe950404ae37cba8753470b4d9",
    "photo_taken_at": "2026-10-08T12:27:15+07:00",
    "submitted_at": "2026-10-08T12:27:15+07:00",
    "decided_by": null,
    "decided_at": null,
    "reject_reason": null,
    "daily_work_card_id": null
  }
}
```

### POST /work/submissions/{id}/cancel

Status 200.

```json
{
  "data": {
    "id": 2,
    "type": {
      "code": "ambil_bahan",
      "label": "Ambil Bahan"
    },
    "status": {
      "code": "dibatalkan",
      "label": "Dibatalkan"
    },
    "work_date": "2026-10-08",
    "worker": {
      "id": 4,
      "name": "Siti"
    },
    "batch_assignment_id": 1,
    "rework_item_id": null,
    "batch_code": "B-MOB-01",
    "item": "Sudut Putih",
    "gram": "300.00",
    "pcs": 36,
    "photo_url": "http://localhost/storage/mobile/ambil-bahan/2026/10/a8c21497-3e56-4e0b-ae7d-dbaf91060a29.jpg?expires=1791438135&signature=de38f870813c7b49ae84dcc6c37090fdab794dfea7e6bb32c12d835801db7de8",
    "photo_taken_at": "2026-10-08T12:27:05+07:00",
    "submitted_at": "2026-10-08T12:27:05+07:00",
    "decided_by": null,
    "decided_at": "2026-10-08T12:27:15+07:00",
    "reject_reason": null,
    "daily_work_card_id": null
  }
}
```

### GET /work/today

Status 200.

```json
{
  "data": {
    "date": "2026-10-08",
    "card": {
      "id": 19,
      "work_date": "2026-10-08",
      "worker": {
        "id": 4,
        "name": "Siti"
      },
      "location": "BEST - Jasa Pencucian",
      "status": {
        "code": "draft",
        "label": "Draf"
      },
      "qc_status": null,
      "rework_date": null,
      "verified": false,
      "verified_at": null,
      "verified_by": null,
      "material": {
        "gram": "400.00",
        "pcs": 50,
        "rows": [
          {
            "batch_assignment_id": 1,
            "batch_code": "B-MOB-01",
            "item": "Sudut Putih",
            "gram": "400.00",
            "pcs": 50
          }
        ]
      },
      "pcs_lembab": null,
      "result": {
        "gram": null,
        "groups": [],
        "rows": []
      },
      "weighing_confirmation": null,
      "wage": {
        "status": {
          "code": "tertahan",
          "label": "Tertahan"
        },
        "amount": "520000.00",
        "reason": null,
        "calculation_id": null
      }
    },
    "submissions": [
      {
        "id": 1,
        "type": {
          "code": "ambil_bahan",
          "label": "Ambil Bahan"
        },
        "status": {
          "code": "disetujui",
          "label": "Disetujui"
        },
        "work_date": "2026-10-08",
        "worker": {
          "id": 4,
          "name": "Siti"
        },
        "batch_assignment_id": 1,
        "rework_item_id": null,
        "batch_code": "B-MOB-01",
        "item": "Sudut Putih",
        "gram": "400.00",
        "pcs": 50,
        "photo_url": "http://localhost/storage/mobile/ambil-bahan/2026/10/f55a6bce-a26a-499f-bc71-c7fd91759a85.jpg?expires=1791438135&signature=1a4d407f8e1bfea80aa46c6e0ff08cc93fc1032e10c28498ef4f8dfa0770d339",
        "photo_taken_at": "2026-10-08T12:27:05+07:00",
        "submitted_at": "2026-10-08T12:27:05+07:00",
        "decided_by": "Bu Sari",
        "decided_at": "2026-10-08T12:27:05+07:00",
        "reject_reason": null,
        "daily_work_card_id": 19
      },
      {
        "id": 2,
        "type": {
          "code": "ambil_bahan",
          "label": "Ambil Bahan"
        },
        "status": {
          "code": "menunggu",
          "label": "Menunggu"
        },
        "work_date": "2026-10-08",
        "worker": {
          "id": 4,
          "name": "Siti"
        },
        "batch_assignment_id": 1,
        "rework_item_id": null,
        "batch_code": "B-MOB-01",
        "item": "Sudut Putih",
        "gram": "300.00",
        "pcs": 36,
        "photo_url": "http://localhost/storage/mobile/ambil-bahan/2026/10/a8c21497-3e56-4e0b-ae7d-dbaf91060a29.jpg?expires=1791438135&signature=de38f870813c7b49ae84dcc6c37090fdab794dfea7e6bb32c12d835801db7de8",
        "photo_taken_at": "2026-10-08T12:27:05+07:00",
        "submitted_at": "2026-10-08T12:27:05+07:00",
        "decided_by": null,
        "decided_at": null,
        "reject_reason": null,
        "daily_work_card_id": null
      }
    ],
    "pending_count": 1
  }
}
```

### GET /work/history

Status 200.

```json
{
  "data": [
    {
      "date": "2026-10-08",
      "card": {
        "id": 19,
        "work_date": "2026-10-08",
        "worker": {
          "id": 4,
          "name": "Siti"
        },
        "location": "BEST - Jasa Pencucian",
        "status": {
          "code": "draft",
          "label": "Draf"
        },
        "qc_status": null,
        "rework_date": null,
        "verified": false,
        "verified_at": null,
        "verified_by": null,
        "material": {
          "gram": "400.00",
          "pcs": 50,
          "rows": [
            {
              "batch_assignment_id": 1,
              "batch_code": "B-MOB-01",
              "item": "Sudut Putih",
              "gram": "400.00",
              "pcs": 50
            }
          ]
        },
        "pcs_lembab": null,
        "result": {
          "gram": null,
          "groups": [],
          "rows": []
        },
        "weighing_confirmation": null,
        "wage": {
          "status": {
            "code": "tertahan",
            "label": "Tertahan"
          },
          "amount": "520000.00",
          "reason": null,
          "calculation_id": null
        }
      },
      "submissions": [
        {
          "id": 1,
          "type": {
            "code": "ambil_bahan",
            "label": "Ambil Bahan"
          },
          "status": {
            "code": "disetujui",
            "label": "Disetujui"
          },
          "work_date": "2026-10-08",
          "worker": {
            "id": 4,
            "name": "Siti"
          },
          "batch_assignment_id": 1,
          "rework_item_id": null,
          "batch_code": "B-MOB-01",
          "item": "Sudut Putih",
          "gram": "400.00",
          "pcs": 50,
          "photo_url": "http://localhost/storage/mobile/ambil-bahan/2026/10/f55a6bce-a26a-499f-bc71-c7fd91759a85.jpg?expires=1791438135&signature=1a4d407f8e1bfea80aa46c6e0ff08cc93fc1032e10c28498ef4f8dfa0770d339",
          "photo_taken_at": "2026-10-08T12:27:05+07:00",
          "submitted_at": "2026-10-08T12:27:05+07:00",
          "decided_by": "Bu Sari",
          "decided_at": "2026-10-08T12:27:05+07:00",
          "reject_reason": null,
          "daily_work_card_id": 19
        },
        {
          "id": 2,
          "type": {
            "code": "ambil_bahan",
            "label": "Ambil Bahan"
          },
          "status": {
            "code": "menunggu",
            "label": "Menunggu"
          },
          "work_date": "2026-10-08",
          "worker": {
            "id": 4,
            "name": "Siti"
          },
          "batch_assignment_id": 1,
          "rework_item_id": null,
          "batch_code": "B-MOB-01",
          "item": "Sudut Putih",
          "gram": "300.00",
          "pcs": 36,
          "photo_url": "http://localhost/storage/mobile/ambil-bahan/2026/10/a8c21497-3e56-4e0b-ae7d-dbaf91060a29.jpg?expires=1791438135&signature=de38f870813c7b49ae84dcc6c37090fdab794dfea7e6bb32c12d835801db7de8",
          "photo_taken_at": "2026-10-08T12:27:05+07:00",
          "submitted_at": "2026-10-08T12:27:05+07:00",
          "decided_by": null,
          "decided_at": null,
          "reject_reason": null,
          "daily_work_card_id": null
        }
      ],
      "pending_count": 1
    },
    {
      "date": "2026-10-07",
      "card": {
        "id": 16,
        "work_date": "2026-10-07",
        "worker": {
          "id": 4,
          "name": "Siti"
        },
        "location": "BEST - Jasa Pencucian",
        "status": {
          "code": "lolos_qc",
          "label": "Lolos QC"
        },
        "qc_status": {
          "code": "standard",
          "label": "Standard"
        },
        "rework_date": null,
        "verified": false,
        "verified_at": null,
        "verified_by": null,
        "material": {
          "gram": "500.00",
          "pcs": 62,
          "rows": [
            {
              "batch_assignment_id": 1,
              "batch_code": "B-MOB-01",
              "item": "Sudut Putih",
              "gram": "500.00",
              "pcs": 62
            }
          ]
        },
        "pcs_lembab": null,
        "result": {
          "gram": "475.00",
          "groups": [
            {
              "group": "utuh",
              "gram": "300.00",
              "pcs": 0
            },
            {
              "group": "kecil",
              "gram": "50.00",
              "pcs": 0
            }
          ],
          "rows": [
            {
              "item_id": 3,
              "item": "PK2",
              "group": "utuh",
              "pcs_lembab": 62,
              "gram": "300.00",
              "pcs": null,
              "retur_tujuan": null
            },
            {
              "item_id": 4,
              "item": "Kaki",
              "group": "kecil",
              "pcs_lembab": null,
              "gram": "50.00",
              "pcs": null,
              "retur_tujuan": null
            }
          ]
        },
        "weighing_confirmation": {
          "status": {
            "code": "menunggu",
            "label": "Menunggu"
          },
          "requested_at": "2026-10-08T12:27:05+07:00",
          "deadline": "2026-10-09T12:27:05+07:00",
          "answered_at": null,
          "reason": null
        },
        "wage": {
          "status": {
            "code": "tertahan",
            "label": "Tertahan"
          },
          "amount": "1232500.00",
          "reason": null,
          "calculation_id": null
        }
      },
      "submissions": [],
      "pending_count": 0
    }
  ],
  "meta": {
    "from": "2026-10-02",
    "to": "2026-10-08"
  }
}
```

### GET /team (Kepala Pencuci)

Status 200.

```json
{
  "data": [
    {
      "id": 6,
      "name": "Dewi",
      "role": {
        "code": "pencuci",
        "label": "Pencuci"
      },
      "atasan": "Bu Sari",
      "attendance_today": {
        "status": {
          "code": "hadir",
          "label": "Hadir"
        },
        "check_in": "07:50",
        "check_out": null,
        "check_in_at": "2026-10-08T07:50:00+07:00",
        "check_out_at": null,
        "location_flag": null
      },
      "rations": [
        {
          "batch_assignment_id": 3,
          "batch_code": "B-MOB-01",
          "remaining_gram": "600.00"
        }
      ],
      "card_today": null,
      "pending_submissions": 1
    },
    {
      "id": 5,
      "name": "Rina",
      "role": {
        "code": "pencuci",
        "label": "Pencuci"
      },
      "atasan": "Bu Sari",
      "attendance_today": {
        "status": {
          "code": "hadir",
          "label": "Hadir"
        },
        "check_in": "07:50",
        "check_out": null,
        "check_in_at": "2026-10-08T07:50:00+07:00",
        "check_out_at": null,
        "location_flag": null
      },
      "rations": [
        {
          "batch_assignment_id": 2,
          "batch_code": "B-MOB-01",
          "remaining_gram": "550.00"
        }
      ],
      "card_today": null,
      "pending_submissions": 1
    }
  ]
}
```

### GET /team (Mandor)

Status 200.

```json
{
  "data": [
    {
      "id": 3,
      "name": "Bu Sari",
      "role": {
        "code": "kepala_pencuci",
        "label": "Kepala Pencuci"
      },
      "atasan": "Pak Joko",
      "attendance_today": {
        "status": {
          "code": "hadir",
          "label": "Hadir"
        },
        "check_in": "07:50",
        "check_out": null,
        "check_in_at": "2026-10-08T07:50:00+07:00",
        "check_out_at": null,
        "location_flag": null
      },
      "rations": [],
      "card_today": null,
      "pending_submissions": 0
    },
    {
      "id": 6,
      "name": "Dewi",
      "role": {
        "code": "pencuci",
        "label": "Pencuci"
      },
      "atasan": "Bu Sari",
      "attendance_today": {
        "status": {
          "code": "hadir",
          "label": "Hadir"
        },
        "check_in": "07:50",
        "check_out": null,
        "check_in_at": "2026-10-08T07:50:00+07:00",
        "check_out_at": null,
        "location_flag": null
      },
      "rations": [
        {
          "batch_assignment_id": 3,
          "batch_code": "B-MOB-01",
          "remaining_gram": "600.00"
        }
      ],
      "card_today": null,
      "pending_submissions": 1
    }
  ]
}
```

### GET /approvals

Status 200.

```json
{
  "data": [
    {
      "id": 2,
      "type": {
        "code": "ambil_bahan",
        "label": "Ambil Bahan"
      },
      "status": {
        "code": "menunggu",
        "label": "Menunggu"
      },
      "work_date": "2026-10-08",
      "worker": {
        "id": 4,
        "name": "Siti"
      },
      "batch_assignment_id": 1,
      "rework_item_id": null,
      "batch_code": "B-MOB-01",
      "item": "Sudut Putih",
      "gram": "300.00",
      "pcs": 36,
      "photo_url": "http://localhost/storage/mobile/ambil-bahan/2026/10/a8c21497-3e56-4e0b-ae7d-dbaf91060a29.jpg?expires=1791438135&signature=de38f870813c7b49ae84dcc6c37090fdab794dfea7e6bb32c12d835801db7de8",
      "photo_taken_at": "2026-10-08T12:27:05+07:00",
      "submitted_at": "2026-10-08T12:27:05+07:00",
      "decided_by": null,
      "decided_at": null,
      "reject_reason": null,
      "daily_work_card_id": null
    },
    {
      "id": 3,
      "type": {
        "code": "ambil_bahan",
        "label": "Ambil Bahan"
      },
      "status": {
        "code": "menunggu",
        "label": "Menunggu"
      },
      "work_date": "2026-10-08",
      "worker": {
        "id": 5,
        "name": "Rina"
      },
      "batch_assignment_id": 2,
      "rework_item_id": null,
      "batch_code": "B-MOB-01",
      "item": "Sudut Putih",
      "gram": "450.00",
      "pcs": 55,
      "photo_url": "http://localhost/storage/mobile/ambil-bahan/2026/10/a588118a-10a6-4c72-b780-9c2effa1308b.jpg?expires=1791438135&signature=a2ecdfffd862f46ef955496aeb8c64bf792fbda9f527de65e89783afe37996a2",
      "photo_taken_at": "2026-10-08T12:27:05+07:00",
      "submitted_at": "2026-10-08T12:27:05+07:00",
      "decided_by": null,
      "decided_at": null,
      "reject_reason": null,
      "daily_work_card_id": null
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 20,
    "total": 3
  }
}
```

### GET /approvals/{id}

Status 200.

```json
{
  "data": {
    "id": 2,
    "type": {
      "code": "ambil_bahan",
      "label": "Ambil Bahan"
    },
    "status": {
      "code": "menunggu",
      "label": "Menunggu"
    },
    "work_date": "2026-10-08",
    "worker": {
      "id": 4,
      "name": "Siti"
    },
    "batch_assignment_id": 1,
    "rework_item_id": null,
    "batch_code": "B-MOB-01",
    "item": "Sudut Putih",
    "gram": "300.00",
    "pcs": 36,
    "photo_url": "http://localhost/storage/mobile/ambil-bahan/2026/10/a8c21497-3e56-4e0b-ae7d-dbaf91060a29.jpg?expires=1791438135&signature=de38f870813c7b49ae84dcc6c37090fdab794dfea7e6bb32c12d835801db7de8",
    "photo_taken_at": "2026-10-08T12:27:05+07:00",
    "submitted_at": "2026-10-08T12:27:05+07:00",
    "decided_by": null,
    "decided_at": null,
    "reject_reason": null,
    "daily_work_card_id": null,
    "photo": {
      "url": "http://localhost/storage/mobile/ambil-bahan/2026/10/a8c21497-3e56-4e0b-ae7d-dbaf91060a29.jpg?expires=1791438135&signature=de38f870813c7b49ae84dcc6c37090fdab794dfea7e6bb32c12d835801db7de8",
      "taken_at": "2026-10-08T12:27:05+07:00"
    },
    "ration": {
      "batch_assignment_id": 1,
      "target_gram": "5000.00",
      "taken_gram": "3400.00",
      "pending_other_gram": "0.00",
      "remaining_gram": "1600.00"
    },
    "rework": null,
    "card": null
  }
}
```

### GET /approvals/{id} (kerja ulang)

Status 200.

```json
{
  "data": {
    "id": 4,
    "type": {
      "code": "ambil_kerja_ulang",
      "label": "Ambil Kerja Ulang"
    },
    "status": {
      "code": "menunggu",
      "label": "Menunggu"
    },
    "work_date": "2026-10-08",
    "worker": {
      "id": 6,
      "name": "Dewi"
    },
    "batch_assignment_id": null,
    "rework_item_id": 1,
    "batch_code": null,
    "item": null,
    "gram": null,
    "pcs": 40,
    "photo_url": "http://localhost/storage/mobile/kerja-ulang/2026/10/bc65653a-7246-4811-bf2a-ea640aca939d.jpg?expires=1791438136&signature=a922c0e1ac2e91aca912100e6356fb5189cec7df15d3329e806b4a1c0311ab9c",
    "photo_taken_at": "2026-10-08T12:27:05+07:00",
    "submitted_at": "2026-10-08T12:27:05+07:00",
    "decided_by": null,
    "decided_at": null,
    "reject_reason": null,
    "daily_work_card_id": null,
    "photo": {
      "url": "http://localhost/storage/mobile/kerja-ulang/2026/10/bc65653a-7246-4811-bf2a-ea640aca939d.jpg?expires=1791438136&signature=a922c0e1ac2e91aca912100e6356fb5189cec7df15d3329e806b4a1c0311ab9c",
      "taken_at": "2026-10-08T12:27:05+07:00"
    },
    "ration": null,
    "rework": {
      "id": 1,
      "daily_work_card_id": 18,
      "card_date": "2026-10-07",
      "rework_date": "2026-10-09",
      "pcs": 40,
      "gram": null,
      "status": {
        "code": "menunggu_diambil",
        "label": "Belum Diambil"
      },
      "taken_pcs": null,
      "taken_at": null,
      "returned_pcs": null,
      "returned_at": null,
      "pending_submission": true
    },
    "card": null
  }
}
```

### POST /approvals/{id}/approve

Status 200.

```json
{
  "data": {
    "id": 2,
    "type": {
      "code": "ambil_bahan",
      "label": "Ambil Bahan"
    },
    "status": {
      "code": "disetujui",
      "label": "Disetujui"
    },
    "work_date": "2026-10-08",
    "worker": {
      "id": 4,
      "name": "Siti"
    },
    "batch_assignment_id": 1,
    "rework_item_id": null,
    "batch_code": "B-MOB-01",
    "item": "Sudut Putih",
    "gram": "300.00",
    "pcs": 36,
    "photo_url": "http://localhost/storage/mobile/ambil-bahan/2026/10/a8c21497-3e56-4e0b-ae7d-dbaf91060a29.jpg?expires=1791438136&signature=329f6cae0ebaa476104401654379ac7197e3a28d843bb70c096be565361ca982",
    "photo_taken_at": "2026-10-08T12:27:05+07:00",
    "submitted_at": "2026-10-08T12:27:05+07:00",
    "decided_by": "Bu Sari",
    "decided_at": "2026-10-08T12:27:16+07:00",
    "reject_reason": null,
    "daily_work_card_id": 19
  }
}
```

### POST /approvals/{id}/reject

Status 200.

```json
{
  "data": {
    "id": 3,
    "type": {
      "code": "ambil_bahan",
      "label": "Ambil Bahan"
    },
    "status": {
      "code": "ditolak",
      "label": "Ditolak"
    },
    "work_date": "2026-10-08",
    "worker": {
      "id": 5,
      "name": "Rina"
    },
    "batch_assignment_id": 2,
    "rework_item_id": null,
    "batch_code": "B-MOB-01",
    "item": "Sudut Putih",
    "gram": "450.00",
    "pcs": 55,
    "photo_url": "http://localhost/storage/mobile/ambil-bahan/2026/10/a588118a-10a6-4c72-b780-9c2effa1308b.jpg?expires=1791438136&signature=0d0ad9883d8e0d958bddb06d76e3b6e08b55ccc73b910be09727826c8555a71f",
    "photo_taken_at": "2026-10-08T12:27:05+07:00",
    "submitted_at": "2026-10-08T12:27:05+07:00",
    "decided_by": "Bu Sari",
    "decided_at": "2026-10-08T12:27:16+07:00",
    "reject_reason": "Foto timbangan buram, ulangi.",
    "daily_work_card_id": null
  }
}
```

### GET /work-cards (tanpa date)

Status 200.

```json
{
  "data": [
    {
      "id": 19,
      "work_date": "2026-10-08",
      "worker": {
        "id": 4,
        "name": "Siti"
      },
      "location": "BEST - Jasa Pencucian",
      "status": {
        "code": "draft",
        "label": "Draf"
      },
      "qc_status": null,
      "rework_date": null,
      "verified": false,
      "verified_at": null,
      "verified_by": null,
      "material": {
        "gram": "400.00",
        "pcs": 50,
        "rows": [
          {
            "batch_assignment_id": 1,
            "batch_code": "B-MOB-01",
            "item": "Sudut Putih",
            "gram": "400.00",
            "pcs": 50
          }
        ]
      },
      "pcs_lembab": null,
      "result": {
        "gram": null,
        "groups": [],
        "rows": []
      },
      "weighing_confirmation": null,
      "wage": {
        "status": {
          "code": "tertahan",
          "label": "Tertahan"
        },
        "amount": "600000.00",
        "reason": null,
        "calculation_id": null
      }
    },
    {
      "id": 18,
      "work_date": "2026-10-07",
      "worker": {
        "id": 6,
        "name": "Dewi"
      },
      "location": "BEST - Jasa Pencucian",
      "status": {
        "code": "kerja_ulang",
        "label": "Kerja Ulang"
      },
      "qc_status": {
        "code": "belum_standard",
        "label": "Belum Standard"
      },
      "rework_date": "2026-10-09",
      "verified": false,
      "verified_at": null,
      "verified_by": null,
      "material": {
        "gram": "400.00",
        "pcs": 50,
        "rows": [
          {
            "batch_assignment_id": 3,
            "batch_code": "B-MOB-01",
            "item": "Sudut Putih",
            "gram": "400.00",
            "pcs": 50
          }
        ]
      },
      "pcs_lembab": null,
      "result": {
        "gram": "380.00",
        "groups": [
          {
            "group": "utuh",
            "gram": "240.00",
            "pcs": 0
          },
          {
            "group": "kecil",
            "gram": "40.00",
            "pcs": 0
          }
        ],
        "rows": [
          {
            "item_id": 3,
            "item": "PK2",
            "group": "utuh",
            "pcs_lembab": 50,
            "gram": "240.00",
            "pcs": null,
            "retur_tujuan": null
          },
          {
            "item_id": 4,
            "item": "Kaki",
            "group": "kecil",
            "pcs_lembab": null,
            "gram": "40.00",
            "pcs": null,
            "retur_tujuan": null
          }
        ]
      },
      "weighing_confirmation": null,
      "wage": {
        "status": {
          "code": "tertahan",
          "label": "Tertahan"
        },
        "amount": "1256000.00",
        "reason": null,
        "calculation_id": null
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 2,
    "total": 19
  }
}
```

### GET /work-cards?date=

Status 200.

```json
{
  "data": [
    {
      "id": 18,
      "work_date": "2026-10-07",
      "worker": {
        "id": 6,
        "name": "Dewi"
      },
      "location": "BEST - Jasa Pencucian",
      "status": {
        "code": "kerja_ulang",
        "label": "Kerja Ulang"
      },
      "qc_status": {
        "code": "belum_standard",
        "label": "Belum Standard"
      },
      "rework_date": "2026-10-09",
      "verified": false,
      "verified_at": null,
      "verified_by": null,
      "material": {
        "gram": "400.00",
        "pcs": 50,
        "rows": [
          {
            "batch_assignment_id": 3,
            "batch_code": "B-MOB-01",
            "item": "Sudut Putih",
            "gram": "400.00",
            "pcs": 50
          }
        ]
      },
      "pcs_lembab": null,
      "result": {
        "gram": "380.00",
        "groups": [
          {
            "group": "utuh",
            "gram": "240.00",
            "pcs": 0
          },
          {
            "group": "kecil",
            "gram": "40.00",
            "pcs": 0
          }
        ],
        "rows": [
          {
            "item_id": 3,
            "item": "PK2",
            "group": "utuh",
            "pcs_lembab": 50,
            "gram": "240.00",
            "pcs": null,
            "retur_tujuan": null
          },
          {
            "item_id": 4,
            "item": "Kaki",
            "group": "kecil",
            "pcs_lembab": null,
            "gram": "40.00",
            "pcs": null,
            "retur_tujuan": null
          }
        ]
      },
      "weighing_confirmation": null,
      "wage": {
        "status": {
          "code": "tertahan",
          "label": "Tertahan"
        },
        "amount": "1256000.00",
        "reason": null,
        "calculation_id": null
      }
    },
    {
      "id": 17,
      "work_date": "2026-10-07",
      "worker": {
        "id": 5,
        "name": "Rina"
      },
      "location": "BEST - Jasa Pencucian",
      "status": {
        "code": "lolos_qc",
        "label": "Lolos QC"
      },
      "qc_status": {
        "code": "standard",
        "label": "Standard"
      },
      "rework_date": null,
      "verified": false,
      "verified_at": null,
      "verified_by": null,
      "material": {
        "gram": "500.00",
        "pcs": 62,
        "rows": [
          {
            "batch_assignment_id": 2,
            "batch_code": "B-MOB-01",
            "item": "Sudut Putih",
            "gram": "500.00",
            "pcs": 62
          }
        ]
      },
      "pcs_lembab": null,
      "result": {
        "gram": "475.00",
        "groups": [
          {
            "group": "utuh",
            "gram": "300.00",
            "pcs": 0
          },
          {
            "group": "kecil",
            "gram": "50.00",
            "pcs": 0
          }
        ],
        "rows": [
          {
            "item_id": 3,
            "item": "PK2",
            "group": "utuh",
            "pcs_lembab": 62,
            "gram": "300.00",
            "pcs": null,
            "retur_tujuan": null
          },
          {
            "item_id": 4,
            "item": "Kaki",
            "group": "kecil",
            "pcs_lembab": null,
            "gram": "50.00",
            "pcs": null,
            "retur_tujuan": null
          }
        ]
      },
      "weighing_confirmation": null,
      "wage": {
        "status": {
          "code": "tertahan",
          "label": "Tertahan"
        },
        "amount": "1570000.00",
        "reason": null,
        "calculation_id": null
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 2,
    "per_page": 2,
    "total": 3
  }
}
```

### GET /work-cards/{id}

Status 200.

```json
{
  "data": {
    "id": 13,
    "work_date": "2026-10-06",
    "worker": {
      "id": 4,
      "name": "Siti"
    },
    "location": "BEST - Jasa Pencucian",
    "status": {
      "code": "terverifikasi",
      "label": "Terverifikasi"
    },
    "qc_status": {
      "code": "standard",
      "label": "Standard"
    },
    "rework_date": null,
    "verified": true,
    "verified_at": "2026-10-08T12:27:04+07:00",
    "verified_by": "Bu Sari",
    "material": {
      "gram": "500.00",
      "pcs": 62,
      "rows": [
        {
          "batch_assignment_id": 1,
          "batch_code": "B-MOB-01",
          "item": "Sudut Putih",
          "gram": "500.00",
          "pcs": 62
        }
      ]
    },
    "pcs_lembab": null,
    "result": {
      "gram": "475.00",
      "groups": [
        {
          "group": "utuh",
          "gram": "300.00",
          "pcs": 0
        },
        {
          "group": "kecil",
          "gram": "50.00",
          "pcs": 0
        }
      ],
      "rows": [
        {
          "item_id": 3,
          "item": "PK2",
          "group": "utuh",
          "pcs_lembab": 62,
          "gram": "300.00",
          "pcs": null,
          "retur_tujuan": null
        },
        {
          "item_id": 4,
          "item": "Kaki",
          "group": "kecil",
          "pcs_lembab": null,
          "gram": "50.00",
          "pcs": null,
          "retur_tujuan": null
        }
      ]
    },
    "weighing_confirmation": null,
    "wage": {
      "status": {
        "code": "belum_dihitung",
        "label": "belum_dihitung"
      },
      "amount": "1570000.00",
      "reason": null,
      "calculation_id": null
    }
  }
}
```

### POST /work-cards

Status 201.

```json
{
  "data": {
    "id": 20,
    "work_date": "2026-10-08",
    "worker": {
      "id": 5,
      "name": "Rina"
    },
    "location": "BEST - Jasa Pencucian",
    "status": {
      "code": "draft",
      "label": "Draf"
    },
    "qc_status": null,
    "rework_date": null,
    "verified": false,
    "verified_at": null,
    "verified_by": null,
    "material": {
      "gram": "300.00",
      "pcs": 38,
      "rows": [
        {
          "batch_assignment_id": 2,
          "batch_code": "B-MOB-01",
          "item": "Sudut Putih",
          "gram": "300.00",
          "pcs": 38
        }
      ]
    },
    "pcs_lembab": null,
    "result": {
      "gram": null,
      "groups": [
        {
          "group": "utuh",
          "gram": "0.00",
          "pcs": 0
        }
      ],
      "rows": [
        {
          "item_id": 3,
          "item": "PK2",
          "group": "utuh",
          "pcs_lembab": 38,
          "gram": null,
          "pcs": null,
          "retur_tujuan": null
        }
      ]
    },
    "weighing_confirmation": null,
    "wage": {
      "status": {
        "code": "tertahan",
        "label": "Tertahan"
      },
      "amount": "450000.00",
      "reason": null,
      "calculation_id": null
    }
  }
}
```

### PUT /work-cards/{id}

Status 200.

```json
{
  "data": {
    "id": 17,
    "work_date": "2026-10-07",
    "worker": {
      "id": 5,
      "name": "Rina"
    },
    "location": "BEST - Jasa Pencucian",
    "status": {
      "code": "lolos_qc",
      "label": "Lolos QC"
    },
    "qc_status": {
      "code": "standard",
      "label": "Standard"
    },
    "rework_date": null,
    "verified": false,
    "verified_at": null,
    "verified_by": null,
    "material": {
      "gram": "500.00",
      "pcs": 62,
      "rows": [
        {
          "batch_assignment_id": 2,
          "batch_code": "B-MOB-01",
          "item": "Sudut Putih",
          "gram": "500.00",
          "pcs": 62
        }
      ]
    },
    "pcs_lembab": null,
    "result": {
      "gram": "475.00",
      "groups": [
        {
          "group": "utuh",
          "gram": "300.00",
          "pcs": 0
        },
        {
          "group": "kecil",
          "gram": "50.00",
          "pcs": 0
        }
      ],
      "rows": [
        {
          "item_id": 3,
          "item": "PK2",
          "group": "utuh",
          "pcs_lembab": 62,
          "gram": "300.00",
          "pcs": null,
          "retur_tujuan": null
        },
        {
          "item_id": 4,
          "item": "Kaki",
          "group": "kecil",
          "pcs_lembab": null,
          "gram": "50.00",
          "pcs": null,
          "retur_tujuan": null
        }
      ]
    },
    "weighing_confirmation": null,
    "wage": {
      "status": {
        "code": "tertahan",
        "label": "Tertahan"
      },
      "amount": "1570000.00",
      "reason": null,
      "calculation_id": null
    }
  }
}
```

### POST /work-cards/{id}/qc

Status 200.

```json
{
  "data": {
    "id": 18,
    "work_date": "2026-10-07",
    "worker": {
      "id": 6,
      "name": "Dewi"
    },
    "location": "BEST - Jasa Pencucian",
    "status": {
      "code": "lolos_qc",
      "label": "Lolos QC"
    },
    "qc_status": {
      "code": "standard",
      "label": "Standard"
    },
    "rework_date": null,
    "verified": false,
    "verified_at": null,
    "verified_by": null,
    "material": {
      "gram": "400.00",
      "pcs": 50,
      "rows": [
        {
          "batch_assignment_id": 3,
          "batch_code": "B-MOB-01",
          "item": "Sudut Putih",
          "gram": "400.00",
          "pcs": 50
        }
      ]
    },
    "pcs_lembab": null,
    "result": {
      "gram": "380.00",
      "groups": [
        {
          "group": "utuh",
          "gram": "240.00",
          "pcs": 0
        },
        {
          "group": "kecil",
          "gram": "40.00",
          "pcs": 0
        }
      ],
      "rows": [
        {
          "item_id": 3,
          "item": "PK2",
          "group": "utuh",
          "pcs_lembab": null,
          "gram": "240.00",
          "pcs": null,
          "retur_tujuan": null
        },
        {
          "item_id": 4,
          "item": "Kaki",
          "group": "kecil",
          "pcs_lembab": null,
          "gram": "40.00",
          "pcs": null,
          "retur_tujuan": null
        }
      ]
    },
    "weighing_confirmation": null,
    "wage": {
      "status": {
        "code": "tertahan",
        "label": "Tertahan"
      },
      "amount": "1256000.00",
      "reason": null,
      "calculation_id": null
    }
  }
}
```

### POST /work-cards/{id}/verify

Status 200.

```json
{
  "data": {
    "id": 17,
    "work_date": "2026-10-07",
    "worker": {
      "id": 5,
      "name": "Rina"
    },
    "location": "BEST - Jasa Pencucian",
    "status": {
      "code": "terverifikasi",
      "label": "Terverifikasi"
    },
    "qc_status": {
      "code": "standard",
      "label": "Standard"
    },
    "rework_date": null,
    "verified": true,
    "verified_at": "2026-10-08T12:27:16+07:00",
    "verified_by": "Bu Sari",
    "material": {
      "gram": "500.00",
      "pcs": 62,
      "rows": [
        {
          "batch_assignment_id": 2,
          "batch_code": "B-MOB-01",
          "item": "Sudut Putih",
          "gram": "500.00",
          "pcs": 62
        }
      ]
    },
    "pcs_lembab": null,
    "result": {
      "gram": "475.00",
      "groups": [
        {
          "group": "utuh",
          "gram": "300.00",
          "pcs": 0
        },
        {
          "group": "kecil",
          "gram": "50.00",
          "pcs": 0
        }
      ],
      "rows": [
        {
          "item_id": 3,
          "item": "PK2",
          "group": "utuh",
          "pcs_lembab": 62,
          "gram": "300.00",
          "pcs": null,
          "retur_tujuan": null
        },
        {
          "item_id": 4,
          "item": "Kaki",
          "group": "kecil",
          "pcs_lembab": null,
          "gram": "50.00",
          "pcs": null,
          "retur_tujuan": null
        }
      ]
    },
    "weighing_confirmation": null,
    "wage": {
      "status": {
        "code": "belum_dihitung",
        "label": "belum_dihitung"
      },
      "amount": "1570000.00",
      "reason": null,
      "calculation_id": null
    }
  }
}
```

### GET /me/earnings

Status 200.

```json
{
  "data": {
    "week": "2026-W40",
    "from": "2026-09-28",
    "to": "2026-10-04",
    "finished": true,
    "paid_by": {
      "code": "sion",
      "label": "Dibayar SION"
    },
    "present_days": 3,
    "material_gram": "1500.00",
    "upah_bahan": "1950000.00",
    "upah_hasil": "1747500.00",
    "upah_qc": "0.00",
    "upah_by_status": {
      "tertahan": "0.00",
      "belum_dihitung": "0.00",
      "sudah_dihitung": "3697500.00"
    },
    "gaji_harian": "180000.00",
    "bonus_mingguan": {
      "status": {
        "code": "pending",
        "label": "Menunggu"
      },
      "amount": "75000.00",
      "achieved_gram": "1500.00",
      "target_gram": "3000.00",
      "unit": "gram",
      "finished": true
    },
    "total": "3877500.00",
    "days": [
      {
        "date": "2026-09-28",
        "attendance": null,
        "present": false,
        "material_gram": "0.00",
        "material_pcs": 0,
        "pcs_lembab": 0,
        "result_gram": "0.00",
        "gaji_harian": "0.00",
        "upah_sudah_dihitung": "0.00",
        "cards": []
      },
      {
        "date": "2026-09-29",
        "attendance": null,
        "present": false,
        "material_gram": "0.00",
        "material_pcs": 0,
        "pcs_lembab": 0,
        "result_gram": "0.00",
        "gaji_harian": "0.00",
        "upah_sudah_dihitung": "0.00",
        "cards": []
      }
    ]
  }
}
```

### GET /me/balance (Mandiri)

Status 200.

```json
{
  "data": {
    "paid_by": {
      "code": "sion",
      "label": "Dibayar SION"
    },
    "dapat_dicairkan": "4077500.00",
    "pending": "4154250.00",
    "thr_ditahan": "310200.00",
    "mandor_funds": [],
    "thr_by_contract_year": [
      {
        "contract_year": 1,
        "amount": "310200.00"
      }
    ],
    "pending_items": [
      {
        "kind": "bonus_mingguan",
        "label": "Bonus mingguan 2026-W41",
        "amount": "50000.00",
        "full_amount": "75000.00",
        "status": {
          "code": "pending",
          "label": "Menunggu"
        },
        "reason": null,
        "rule": null,
        "progress": {
          "achieved": "1500.00",
          "target": "3000.00",
          "present_days": 4,
          "unit": "gram"
        },
        "daily_work_card_id": null
      },
      {
        "kind": "bonus_bulanan",
        "label": "Bonus bulanan Oktober 2026",
        "amount": "91750.00",
        "full_amount": null,
        "status": {
          "code": "pending",
          "label": "Menunggu"
        },
        "reason": null,
        "rule": "10% dari laba",
        "progress": {
          "ppe": "917500.00",
          "present_days": 7
        },
        "daily_work_card_id": null
      }
    ],
    "ledger": [
      {
        "id": 60,
        "at": "2026-10-08T12:27:08+07:00",
        "bucket": {
          "code": "cair",
          "label": "Dapat Dicairkan"
        },
        "kind": {
          "code": "penarikan",
          "label": "Penarikan"
        },
        "amount": "-100000.00",
        "period_start": null,
        "period_end": null,
        "contract_year": null,
        "description": "Penarikan dana #1 (transfer)"
      },
      {
        "id": 57,
        "at": "2026-10-08T12:27:08+07:00",
        "bucket": {
          "code": "cair",
          "label": "Dapat Dicairkan"
        },
        "kind": {
          "code": "koreksi",
          "label": "Koreksi"
        },
        "amount": "300000.00",
        "period_start": null,
        "period_end": null,
        "contract_year": null,
        "description": "Koreksi Admin: Saldo awal data demo"
      }
    ],
    "withdrawal": {
      "can_withdraw": false,
      "min_amount": "50000.00",
      "active": {
        "id": 3,
        "amount": "75000.00",
        "status": {
          "code": "diajukan",
          "label": "Diajukan"
        },
        "notes": "Belanja mingguan",
        "method": null,
        "reject_reason": null,
        "funded_by": {
          "code": "sion",
          "label": "SION"
        },
        "requested_at": "2026-10-08T12:27:09+07:00",
        "approved_at": null,
        "paid_at": null,
        "rejected_at": null,
        "cancelled_at": null
      }
    }
  }
}
```

### GET /me/balance (Borongan)

Status 200.

```json
{
  "data": {
    "paid_by": {
      "code": "mandor",
      "label": "Dibayar Mandor"
    },
    "dapat_dicairkan": "0.00",
    "pending": "0.00",
    "thr_ditahan": "0.00",
    "mandor_funds": [
      {
        "mandor": {
          "id": 2,
          "name": "Pak Joko"
        },
        "dapat_dicairkan": "3847500.00",
        "thr_ditahan": "295800.00"
      }
    ],
    "thr_by_contract_year": [],
    "pending_items": [],
    "ledger": [
      {
        "id": 61,
        "at": "2026-10-08T12:27:09+07:00",
        "bucket": {
          "code": "cair",
          "label": "Dapat Dicairkan"
        },
        "kind": {
          "code": "penarikan",
          "label": "Penarikan"
        },
        "amount": "-100000.00",
        "period_start": null,
        "period_end": null,
        "contract_year": null,
        "description": "Penarikan dana #4 (tunai)"
      },
      {
        "id": 58,
        "at": "2026-10-08T12:27:08+07:00",
        "bucket": {
          "code": "cair",
          "label": "Dapat Dicairkan"
        },
        "kind": {
          "code": "koreksi",
          "label": "Koreksi"
        },
        "amount": "250000.00",
        "period_start": null,
        "period_end": null,
        "contract_year": null,
        "description": "Saldo awal data demo (dana Mandor)"
      }
    ],
    "withdrawal": {
      "can_withdraw": true,
      "min_amount": "50000.00",
      "active": null
    }
  }
}
```

### GET /me/bonuses

Status 200.

```json
{
  "data": {
    "paid_by": {
      "code": "sion",
      "label": "Dibayar SION"
    },
    "weekly": [
      {
        "week": "2026-W41",
        "from": "2026-10-05",
        "status": {
          "code": "pending",
          "label": "Menunggu"
        },
        "amount": "75000.00",
        "achieved_gram": "1500.00",
        "target_gram": "3000.00",
        "unit": "gram",
        "finished": false
      },
      {
        "week": "2026-W40",
        "from": "2026-09-28",
        "status": {
          "code": "pending",
          "label": "Menunggu"
        },
        "amount": "75000.00",
        "achieved_gram": "1500.00",
        "target_gram": "3000.00",
        "unit": "gram",
        "finished": true
      }
    ],
    "monthly": [
      {
        "month": "2026-10",
        "status": {
          "code": "pending",
          "label": "Menunggu"
        },
        "amount": null,
        "rule": "10% dari laba",
        "ppe": "917500.00",
        "complete": true,
        "finished": false
      },
      {
        "month": "2026-09",
        "status": {
          "code": "tidak_dibayar",
          "label": "Tidak Dibayar"
        },
        "amount": "0.00",
        "rule": "10% dari laba",
        "ppe": "0.00",
        "complete": true,
        "finished": true
      }
    ]
  }
}
```

### GET /me/kpi

Status 200.

```json
{
  "data": {
    "month": "2026-10",
    "work_days": 6,
    "present_days": 7,
    "material_gram": "3000.00",
    "gram_per_day": "500.00",
    "target_gram_per_day": "500.00",
    "yield": [
      {
        "group": "utuh",
        "gram": "1800.00",
        "percent": "60.00",
        "target_percent": null
      },
      {
        "group": "kecil",
        "gram": "300.00",
        "percent": "10.00",
        "target_percent": null
      }
    ],
    "ppe": {
      "nilai_jual": "23000000.00",
      "upah": "6162500.00",
      "gaji_harian": "420000.00",
      "bonus_mingguan": "0.00",
      "biaya_tenaga_kerja": "6582500.00",
      "gram_bahan": "2500.00",
      "nilai_target": "15500000.00",
      "modal_bahan": "13041325.00",
      "ppe": "917500.00",
      "cards": "5.00"
    },
    "monthly_bonus": {
      "status": {
        "code": "pending",
        "label": "Menunggu"
      },
      "amount": null
    }
  }
}
```

### GET /me/withdrawals

Status 200.

```json
{
  "data": [
    {
      "id": 3,
      "amount": "75000.00",
      "status": {
        "code": "diajukan",
        "label": "Diajukan"
      },
      "notes": "Belanja mingguan",
      "method": null,
      "reject_reason": null,
      "funded_by": {
        "code": "sion",
        "label": "SION"
      },
      "requested_at": "2026-10-08T12:27:09+07:00",
      "approved_at": null,
      "paid_at": null,
      "rejected_at": null,
      "cancelled_at": null
    },
    {
      "id": 2,
      "amount": "80000.00",
      "status": {
        "code": "ditolak",
        "label": "Ditolak"
      },
      "notes": null,
      "method": null,
      "reject_reason": "Nominal diperiksa ulang dulu",
      "funded_by": {
        "code": "sion",
        "label": "SION"
      },
      "requested_at": "2026-10-08T12:27:09+07:00",
      "approved_at": null,
      "paid_at": null,
      "rejected_at": "2026-10-08T12:27:09+07:00",
      "cancelled_at": null
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 20,
    "total": 3
  }
}
```

### POST /me/withdrawals (Borongan, dana Mandor)

Status 201.

```json
{
  "data": {
    "id": 7,
    "amount": "50000.00",
    "status": {
      "code": "diajukan",
      "label": "Diajukan"
    },
    "notes": "Beli beras",
    "method": null,
    "reject_reason": null,
    "funded_by": {
      "code": "mandor",
      "label": "Mandor Pak Joko"
    },
    "requested_at": "2026-10-08T12:27:18+07:00",
    "approved_at": null,
    "paid_at": null,
    "rejected_at": null,
    "cancelled_at": null
  }
}
```

### POST /me/withdrawals/{id}/cancel

Status 200.

```json
{
  "data": {
    "id": 3,
    "amount": "75000.00",
    "status": {
      "code": "dibatalkan",
      "label": "Dibatalkan"
    },
    "notes": "Belanja mingguan",
    "method": null,
    "reject_reason": null,
    "funded_by": {
      "code": "sion",
      "label": "SION"
    },
    "requested_at": "2026-10-08T12:27:09+07:00",
    "approved_at": null,
    "paid_at": null,
    "rejected_at": null,
    "cancelled_at": "2026-10-08T12:27:18+07:00"
  }
}
```

### GET /me/weighings

Status 200.

```json
{
  "data": [
    {
      "id": 16,
      "work_date": "2026-10-07",
      "worker": {
        "id": 4,
        "name": "Siti"
      },
      "location": "BEST - Jasa Pencucian",
      "status": {
        "code": "lolos_qc",
        "label": "Lolos QC"
      },
      "qc_status": {
        "code": "standard",
        "label": "Standard"
      },
      "rework_date": null,
      "verified": false,
      "verified_at": null,
      "verified_by": null,
      "material": {
        "gram": "500.00",
        "pcs": 62,
        "rows": [
          {
            "batch_assignment_id": 1,
            "batch_code": "B-MOB-01",
            "item": "Sudut Putih",
            "gram": "500.00",
            "pcs": 62
          }
        ]
      },
      "pcs_lembab": null,
      "result": {
        "gram": "475.00",
        "groups": [
          {
            "group": "utuh",
            "gram": "300.00",
            "pcs": 0
          },
          {
            "group": "kecil",
            "gram": "50.00",
            "pcs": 0
          }
        ],
        "rows": [
          {
            "item_id": 3,
            "item": "PK2",
            "group": "utuh",
            "pcs_lembab": 62,
            "gram": "300.00",
            "pcs": null,
            "retur_tujuan": null
          },
          {
            "item_id": 4,
            "item": "Kaki",
            "group": "kecil",
            "pcs_lembab": null,
            "gram": "50.00",
            "pcs": null,
            "retur_tujuan": null
          }
        ]
      },
      "weighing_confirmation": {
        "status": {
          "code": "menunggu",
          "label": "Menunggu"
        },
        "requested_at": "2026-10-08T12:27:05+07:00",
        "deadline": "2026-10-09T12:27:05+07:00",
        "answered_at": null,
        "reason": null
      },
      "wage": {
        "status": {
          "code": "tertahan",
          "label": "Tertahan"
        },
        "amount": "1232500.00",
        "reason": null,
        "calculation_id": null
      }
    }
  ]
}
```

### POST /work-cards/{id}/weighing

Status 200.

```json
{
  "data": {
    "id": 16,
    "work_date": "2026-10-07",
    "worker": {
      "id": 4,
      "name": "Siti"
    },
    "location": "BEST - Jasa Pencucian",
    "status": {
      "code": "lolos_qc",
      "label": "Lolos QC"
    },
    "qc_status": {
      "code": "standard",
      "label": "Standard"
    },
    "rework_date": null,
    "verified": false,
    "verified_at": null,
    "verified_by": null,
    "material": {
      "gram": "500.00",
      "pcs": 62,
      "rows": [
        {
          "batch_assignment_id": 1,
          "batch_code": "B-MOB-01",
          "item": "Sudut Putih",
          "gram": "500.00",
          "pcs": 62
        }
      ]
    },
    "pcs_lembab": null,
    "result": {
      "gram": "475.00",
      "groups": [
        {
          "group": "utuh",
          "gram": "300.00",
          "pcs": 0
        },
        {
          "group": "kecil",
          "gram": "50.00",
          "pcs": 0
        }
      ],
      "rows": [
        {
          "item_id": 3,
          "item": "PK2",
          "group": "utuh",
          "pcs_lembab": 62,
          "gram": "300.00",
          "pcs": null,
          "retur_tujuan": null
        },
        {
          "item_id": 4,
          "item": "Kaki",
          "group": "kecil",
          "pcs_lembab": null,
          "gram": "50.00",
          "pcs": null,
          "retur_tujuan": null
        }
      ]
    },
    "weighing_confirmation": {
      "status": {
        "code": "setuju",
        "label": "Disetujui"
      },
      "requested_at": "2026-10-08T12:27:05+07:00",
      "deadline": null,
      "answered_at": "2026-10-08T12:27:18+07:00",
      "reason": null
    },
    "wage": {
      "status": {
        "code": "tertahan",
        "label": "Tertahan"
      },
      "amount": "1232500.00",
      "reason": null,
      "calculation_id": null
    }
  }
}
```

### GET /me/daily-profit

Status 200.

```json
{
  "data": [
    {
      "date": "2026-10-02",
      "cards": 1,
      "nilai_jual": "4600000.00",
      "hpp_bahan": "2608265.00",
      "upah": "1887500.00",
      "laba": "104235.00",
      "persen": "2.32",
      "complete": true
    },
    {
      "date": "2026-10-03",
      "cards": 1,
      "nilai_jual": "4600000.00",
      "hpp_bahan": "2608265.00",
      "upah": "1887500.00",
      "laba": "104235.00",
      "persen": "2.32",
      "complete": true
    }
  ],
  "meta": {
    "from": "2026-10-02",
    "to": "2026-10-08"
  }
}
```

### GET /team/daily-profit

Status 200.

```json
{
  "data": [
    {
      "date": "2026-10-02",
      "cards": 3,
      "nilai_jual": "12880000.00",
      "hpp_bahan": "7303142.00",
      "upah": "4630000.00",
      "laba": "946858.00",
      "persen": "7.93",
      "complete": true,
      "members": [
        {
          "user": {
            "id": 6,
            "name": "Dewi"
          },
          "cards": 1,
          "nilai_jual": "3680000.00",
          "hpp_bahan": "2086612.00",
          "upah": "1510000.00",
          "laba": "83388.00",
          "persen": "2.32",
          "complete": true
        },
        {
          "user": {
            "id": 5,
            "name": "Rina"
          },
          "cards": 1,
          "nilai_jual": "4600000.00",
          "hpp_bahan": "2608265.00",
          "upah": "1232500.00",
          "laba": "759235.00",
          "persen": "19.77",
          "complete": true
        }
      ]
    },
    {
      "date": "2026-10-03",
      "cards": 3,
      "nilai_jual": "12880000.00",
      "hpp_bahan": "7303142.00",
      "upah": "4630000.00",
      "laba": "946858.00",
      "persen": "7.93",
      "complete": true,
      "members": [
        {
          "user": {
            "id": 6,
            "name": "Dewi"
          },
          "cards": 1,
          "nilai_jual": "3680000.00",
          "hpp_bahan": "2086612.00",
          "upah": "1510000.00",
          "laba": "83388.00",
          "persen": "2.32",
          "complete": true
        },
        {
          "user": {
            "id": 5,
            "name": "Rina"
          },
          "cards": 1,
          "nilai_jual": "4600000.00",
          "hpp_bahan": "2608265.00",
          "upah": "1232500.00",
          "laba": "759235.00",
          "persen": "19.77",
          "complete": true
        }
      ]
    }
  ],
  "meta": {
    "from": "2026-10-02",
    "to": "2026-10-08"
  }
}
```

### GET /batches/incoming

Status 200.

```json
{
  "data": [
    {
      "id": 3,
      "batch_code": "B-MOB-IN",
      "kode_stok": "BT2610-00003",
      "item": "Sudut Putih",
      "grades": [
        3
      ],
      "mandor": "Pak Joko",
      "status": {
        "code": "assigned",
        "label": "Diserahkan"
      },
      "sent_gram": "3000.00",
      "nilai_hpp": "12852620.00",
      "received_at": null,
      "received_gram": null,
      "received_pcs": null,
      "receipt_shrink_gram": "0.00",
      "receipt_notes": null,
      "receipt_photo_url": null,
      "remaining_gram": "3000.00",
      "can_prepare": false
    }
  ]
}
```

### POST /batches/{id}/receive

Status 200.

```json
{
  "data": {
    "id": 3,
    "batch_code": "B-MOB-IN",
    "kode_stok": "BT2610-00003",
    "item": "Sudut Putih",
    "grades": [
      3
    ],
    "mandor": "Pak Joko",
    "status": {
      "code": "received",
      "label": "Diterima"
    },
    "sent_gram": "3000.00",
    "nilai_hpp": "12852620.00",
    "received_at": "2026-10-08T12:27:19+07:00",
    "received_gram": "2980.00",
    "received_pcs": 350,
    "receipt_shrink_gram": "20.00",
    "receipt_notes": "Selisih timbang 20 gr",
    "receipt_photo_url": "http://localhost/storage/mobile/terima-batch/2026/10/4791cb9a-174e-47cc-bd42-43c1f7df546e.jpg?expires=1791438139&signature=65b21c9ca424397accdc1b1973ab42b5e8d5a28858342c8f8e2e74ca6c260bbf",
    "remaining_gram": "2980.00",
    "can_prepare": true
  }
}
```

### POST /batches/{id}/preparation

Status 201.

```json
{
  "data": {
    "preparation_id": 1,
    "input_gram": "5950.00",
    "output_gram": "5900.00",
    "susut_gram": "50.00",
    "batches": [
      {
        "id": 4,
        "batch_code": "B-MOB-CL-P1",
        "kode_stok": "BT2610-00004",
        "item": "Sudut Putih",
        "grades": [],
        "mandor": "Pak Joko",
        "status": {
          "code": "received",
          "label": "Diterima"
        },
        "sent_gram": "5600.00",
        "nilai_hpp": "27079805.48",
        "received_at": "2026-10-08T12:27:19+07:00",
        "received_gram": "5600.00",
        "received_pcs": null,
        "receipt_shrink_gram": "0.00",
        "receipt_notes": "Hasil penyiapan di rumah pencucian dari batch B-MOB-CL.",
        "receipt_photo_url": null,
        "remaining_gram": "5600.00",
        "can_prepare": false
      },
      {
        "id": 5,
        "batch_code": "B-MOB-CL-P2",
        "kode_stok": "BT2610-00005",
        "item": "Perutan",
        "grades": [],
        "mandor": "Pak Joko",
        "status": {
          "code": "received",
          "label": "Diterima"
        },
        "sent_gram": "300.00",
        "nilai_hpp": "869214.52",
        "received_at": "2026-10-08T12:27:19+07:00",
        "received_gram": "300.00",
        "received_pcs": null,
        "receipt_shrink_gram": "0.00",
        "receipt_notes": "Hasil penyiapan di rumah pencucian dari batch B-MOB-CL.",
        "receipt_photo_url": null,
        "remaining_gram": "300.00",
        "can_prepare": false
      }
    ]
  }
}
```

### GET /containers/{kode}

Status 200.

```json
{
  "data": {
    "kode": "WD00001",
    "jenis": {
      "code": "wadah",
      "label": "Wadah"
    },
    "nama": "Box biru",
    "tara_gram": "350.00",
    "status": {
      "code": "aktif",
      "label": "Aktif"
    },
    "usable": true,
    "isi_kode_stok": null
  }
}
```

### GET /rations

Status 200.

```json
{
  "data": [
    {
      "id": 2,
      "batch_code": "B-MOB-CL",
      "kode_stok": "BT2610-00002",
      "item": "Sudut Putih",
      "grades": [
        2
      ],
      "mandor": "Pak Joko",
      "status": {
        "code": "received",
        "label": "Diterima"
      },
      "sent_gram": "6000.00",
      "nilai_hpp": "27949020.00",
      "received_at": "2026-10-08T12:27:03+07:00",
      "received_gram": "5950.00",
      "received_pcs": 700,
      "receipt_shrink_gram": "50.00",
      "receipt_notes": "Tercecer saat bongkar",
      "receipt_photo_url": "http://localhost/storage/mobile/terima-batch/2026/10/ca2c9984-ec9c-4568-a80a-08bf4747abbf.jpg?expires=1791438139&signature=7d77c40fbc79557d2daaa8aa738a9dddd82f77461fc3c8585f43308b946c030d",
      "remaining_gram": "5950.00",
      "can_prepare": true,
      "assignments": []
    },
    {
      "id": 1,
      "batch_code": "B-MOB-01",
      "kode_stok": "BT2610-00001",
      "item": "Sudut Putih",
      "grades": [
        1
      ],
      "mandor": "Pak Joko",
      "status": {
        "code": "in_progress",
        "label": "Berjalan"
      },
      "sent_gram": "12000.00",
      "nilai_hpp": "62598360.00",
      "received_at": "2026-10-08T12:27:03+07:00",
      "received_gram": "12000.00",
      "received_pcs": 1450,
      "receipt_shrink_gram": "0.00",
      "receipt_notes": null,
      "receipt_photo_url": null,
      "remaining_gram": "0.00",
      "can_prepare": false,
      "assignments": [
        {
          "id": 1,
          "worker": {
            "id": 4,
            "name": "Siti"
          },
          "target_gram": "5000.00",
          "modal_bahan": "26082650.00",
          "status": {
            "code": "pending",
            "label": "pending"
          }
        },
        {
          "id": 2,
          "worker": {
            "id": 5,
            "name": "Rina"
          },
          "target_gram": "4000.00",
          "modal_bahan": "20866120.00",
          "status": {
            "code": "pending",
            "label": "pending"
          }
        }
      ]
    }
  ]
}
```

### POST /rations

Status 201.

```json
{
  "data": {
    "id": 2,
    "batch_code": "B-MOB-CL",
    "kode_stok": "BT2610-00002",
    "item": "Sudut Putih",
    "grades": [
      2
    ],
    "mandor": "Pak Joko",
    "status": {
      "code": "in_progress",
      "label": "Berjalan"
    },
    "sent_gram": "6000.00",
    "nilai_hpp": "27949020.00",
    "received_at": "2026-10-08T12:27:03+07:00",
    "received_gram": "5950.00",
    "received_pcs": 700,
    "receipt_shrink_gram": "50.00",
    "receipt_notes": "Tercecer saat bongkar",
    "receipt_photo_url": "http://localhost/storage/mobile/terima-batch/2026/10/ca2c9984-ec9c-4568-a80a-08bf4747abbf.jpg?expires=1791438139&signature=7d77c40fbc79557d2daaa8aa738a9dddd82f77461fc3c8585f43308b946c030d",
    "remaining_gram": "2450.00",
    "can_prepare": false
  }
}
```

### GET /me/rework

Status 200.

```json
{
  "data": [
    {
      "id": 1,
      "daily_work_card_id": 18,
      "card_date": "2026-10-07",
      "rework_date": "2026-10-09",
      "pcs": 40,
      "gram": null,
      "status": {
        "code": "menunggu_diambil",
        "label": "Belum Diambil"
      },
      "taken_pcs": null,
      "taken_at": null,
      "returned_pcs": null,
      "returned_at": null,
      "pending_submission": false
    }
  ]
}
```

### POST /work/take-rework

Status 201.

```json
{
  "data": {
    "id": 9,
    "type": {
      "code": "ambil_kerja_ulang",
      "label": "Ambil Kerja Ulang"
    },
    "status": {
      "code": "menunggu",
      "label": "Menunggu"
    },
    "work_date": "2026-10-08",
    "worker": {
      "id": 6,
      "name": "Dewi"
    },
    "batch_assignment_id": null,
    "rework_item_id": 1,
    "batch_code": null,
    "item": null,
    "gram": null,
    "pcs": 40,
    "photo_url": null,
    "photo_taken_at": null,
    "submitted_at": "2026-10-08T12:27:19+07:00",
    "decided_by": null,
    "decided_at": null,
    "reject_reason": null,
    "daily_work_card_id": null
  }
}
```

### POST /work/hand-over-rework

Status 201.

```json
{
  "data": {
    "id": 10,
    "type": {
      "code": "serah_kerja_ulang",
      "label": "Serah Kerja Ulang"
    },
    "status": {
      "code": "menunggu",
      "label": "Menunggu"
    },
    "work_date": "2026-10-08",
    "worker": {
      "id": 6,
      "name": "Dewi"
    },
    "batch_assignment_id": null,
    "rework_item_id": 1,
    "batch_code": null,
    "item": null,
    "gram": null,
    "pcs": 40,
    "photo_url": "http://localhost/storage/mobile/kerja-ulang/2026/10/a49c2d88-bfc0-4463-aad3-b80b8bc3ced2.jpg?expires=1791438139&signature=a563757e7ed731198aa89cae62c24c9d3818f7031625c53d4111ba2eb40a60aa",
    "photo_taken_at": "2026-10-08T12:27:19+07:00",
    "submitted_at": "2026-10-08T12:27:19+07:00",
    "decided_by": null,
    "decided_at": null,
    "reject_reason": null,
    "daily_work_card_id": null
  }
}
```

### GET /team/withdrawals

Status 200.

```json
{
  "data": [
    {
      "id": 6,
      "amount": "50000.00",
      "status": {
        "code": "diajukan",
        "label": "Diajukan"
      },
      "notes": null,
      "method": null,
      "reject_reason": null,
      "funded_by": {
        "code": "mandor",
        "label": "Mandor Pak Joko"
      },
      "requested_at": "2026-10-08T12:27:10+07:00",
      "approved_at": null,
      "paid_at": null,
      "rejected_at": null,
      "cancelled_at": null,
      "worker": {
        "id": 6,
        "name": "Dewi"
      }
    },
    {
      "id": 5,
      "amount": "60000.00",
      "status": {
        "code": "ditolak",
        "label": "Ditolak"
      },
      "notes": null,
      "method": null,
      "reject_reason": "Tunggu akhir minggu",
      "funded_by": {
        "code": "mandor",
        "label": "Mandor Pak Joko"
      },
      "requested_at": "2026-10-08T12:27:09+07:00",
      "approved_at": null,
      "paid_at": null,
      "rejected_at": "2026-10-08T12:27:09+07:00",
      "cancelled_at": null,
      "worker": {
        "id": 4,
        "name": "Siti"
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 20,
    "total": 3
  }
}
```

### POST /team/withdrawals/{id}/approve

Status 200.

```json
{
  "data": {
    "id": 6,
    "amount": "50000.00",
    "status": {
      "code": "disetujui",
      "label": "Disetujui"
    },
    "notes": null,
    "method": null,
    "reject_reason": null,
    "funded_by": {
      "code": "mandor",
      "label": "Mandor Pak Joko"
    },
    "requested_at": "2026-10-08T12:27:10+07:00",
    "approved_at": "2026-10-08T12:27:19+07:00",
    "paid_at": null,
    "rejected_at": null,
    "cancelled_at": null,
    "worker": {
      "id": 6,
      "name": "Dewi"
    }
  }
}
```

### POST /team/withdrawals/{id}/reject

Status 200.

```json
{
  "data": {
    "id": 6,
    "amount": "50000.00",
    "status": {
      "code": "ditolak",
      "label": "Ditolak"
    },
    "notes": null,
    "method": null,
    "reject_reason": "Saldo dana Mandor sedang dicek.",
    "funded_by": {
      "code": "mandor",
      "label": "Mandor Pak Joko"
    },
    "requested_at": "2026-10-08T12:27:10+07:00",
    "approved_at": null,
    "paid_at": null,
    "rejected_at": "2026-10-08T12:27:20+07:00",
    "cancelled_at": null,
    "worker": {
      "id": 6,
      "name": "Dewi"
    }
  }
}
```

### POST /team/withdrawals/{id}/pay

Status 200.

```json
{
  "data": {
    "id": 6,
    "amount": "50000.00",
    "status": {
      "code": "dibayar",
      "label": "Dibayar"
    },
    "notes": null,
    "method": "tunai",
    "reject_reason": null,
    "funded_by": {
      "code": "mandor",
      "label": "Mandor Pak Joko"
    },
    "requested_at": "2026-10-08T12:27:10+07:00",
    "approved_at": "2026-10-08T12:27:20+07:00",
    "paid_at": "2026-10-08T12:27:20+07:00",
    "rejected_at": null,
    "cancelled_at": null,
    "worker": {
      "id": 6,
      "name": "Dewi"
    }
  }
}
```

### GET /items

Status 200.

```json
{
  "data": [
    {
      "id": 4,
      "kode": null,
      "name": "Kaki",
      "jenis": {
        "code": "hasil_produksi",
        "label": "Hasil Produksi"
      },
      "grup_hasil": {
        "code": "kecil",
        "label": "Kecil"
      },
      "warna": null,
      "unit": "gram"
    },
    {
      "id": 5,
      "kode": null,
      "name": "Mess C",
      "jenis": {
        "code": "hasil_produksi",
        "label": "Hasil Produksi"
      },
      "grup_hasil": {
        "code": "hancur",
        "label": "Hancur"
      },
      "warna": null,
      "unit": "gram"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 100,
    "total": 4
  }
}
```

### GET /team/bonus-progress

Status 200.

```json
{
  "data": {
    "week": "2026-W41",
    "from": "2026-10-05",
    "to": "2026-10-11",
    "week_finished": false,
    "month": "2026-10",
    "month_finished": false,
    "members": [
      {
        "user": {
          "id": 6,
          "name": "Dewi"
        },
        "kepala_pencuci": {
          "id": 3,
          "name": "Bu Sari"
        },
        "paid_by": {
          "code": "mandor",
          "label": "Dibayar Mandor"
        },
        "target_gram_per_day": "400.00",
        "weekly": {
          "status": {
            "code": "pending",
            "label": "Menunggu"
          },
          "amount": "40000.00",
          "target_gram": "2400.00",
          "achieved_gram": "1200.00",
          "achieved": false,
          "finished": false
        },
        "monthly": {
          "status": {
            "code": "tidak_ada",
            "label": "Tidak Ada"
          },
          "amount": null,
          "ppe": "-1550000.00",
          "cards": 5,
          "complete": true,
          "notes": [],
          "finished": false
        }
      },
      {
        "user": {
          "id": 5,
          "name": "Rina"
        },
        "kepala_pencuci": {
          "id": 3,
          "name": "Bu Sari"
        },
        "paid_by": {
          "code": "sion",
          "label": "Dibayar SION"
        },
        "target_gram_per_day": "500.00",
        "weekly": {
          "status": {
            "code": "pending",
            "label": "Menunggu"
          },
          "amount": "75000.00",
          "target_gram": "3000.00",
          "achieved_gram": "1500.00",
          "achieved": false,
          "finished": false
        },
        "monthly": {
          "status": {
            "code": "pending",
            "label": "Menunggu"
          },
          "amount": null,
          "ppe": "917500.00",
          "cards": 5,
          "complete": true,
          "notes": [],
          "finished": false
        }
      }
    ],
    "kepala": [
      {
        "user": {
          "id": 3,
          "name": "Bu Sari"
        },
        "weekly": {
          "status": {
            "code": "pending",
            "label": "Menunggu"
          },
          "amount": "100000.00",
          "members_achieved": 0,
          "members_active": 3,
          "finished": false
        },
        "monthly": {
          "status": {
            "code": "pending",
            "label": "Menunggu"
          },
          "amount": "300000.00",
          "team_ppe": "-2570000.00",
          "members": 3,
          "members_positive": 1,
          "complete": true,
          "finished": false
        }
      }
    ]
  }
}
```

### GET /mandor/funds

Status 200.

```json
{
  "data": {
    "workers": [
      {
        "worker": {
          "id": 3,
          "name": "Bu Sari"
        },
        "in_team": true,
        "dapat_dicairkan": "13188000.00",
        "thr_ditahan": "1055040.00",
        "withdrawal_active": "0.00"
      },
      {
        "worker": {
          "id": 6,
          "name": "Dewi"
        },
        "in_team": true,
        "dapat_dicairkan": "3058000.00",
        "thr_ditahan": "236640.00",
        "withdrawal_active": "50000.00"
      }
    ],
    "total": {
      "dapat_dicairkan": "20093500.00",
      "thr_ditahan": "1587480.00",
      "withdrawal_active": "50000.00",
      "workers": 3
    }
  }
}
```

### Notifikasi (Tahap 15D)

Diambil 10/10/2026 dari database demo hasil `DemoMobileSeeder` dengan cara yang sama (permintaan dijalankan lalu dibatalkan, daftar dipotong 2 baris).

### GET /me/notifications (Pencuci)

Status 200.

```json
{
  "data": [
    {
      "id": 25,
      "type": {
        "code": "penarikan_ditolak",
        "label": "Penarikan"
      },
      "title": "Penarikan ditolak",
      "body": "Penarikan Rp 60.000,00 ditolak: Tunggu akhir minggu.",
      "created_at": "2026-10-10T12:54:00+07:00",
      "is_read": false,
      "read_at": null,
      "target": {
        "screen": "withdrawal",
        "id": 5
      },
      "data": {}
    },
    {
      "id": 23,
      "type": {
        "code": "penarikan_dibayar",
        "label": "Penarikan"
      },
      "title": "Penarikan dibayar",
      "body": "Penarikan Rp 100.000,00 sudah dibayar (tunai).",
      "created_at": "2026-10-10T12:54:00+07:00",
      "is_read": false,
      "read_at": null,
      "target": {
        "screen": "withdrawal",
        "id": 4
      },
      "data": {}
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 20,
    "total": 6
  }
}
```

### GET /me/notifications?per_page=1&page=6 (Pencuci, konfirmasi timbang)

Status 200.

```json
{
  "data": [
    {
      "id": 4,
      "type": {
        "code": "timbang_menunggu",
        "label": "Konfirmasi Timbang"
      },
      "title": "Konfirmasi hasil timbang",
      "body": "Hasil timbang kartu 09/10/2026 (475 gr bersih) menunggu konfirmasi Anda sampai 11/10/2026 12:53.",
      "created_at": "2026-10-10T12:53:57+07:00",
      "is_read": true,
      "read_at": "2026-10-10T12:54:00+07:00",
      "target": {
        "screen": "weighing",
        "id": 16
      },
      "data": {
        "deadline_at": "2026-10-11T12:53:57+07:00",
        "work_date": "2026-10-09"
      }
    }
  ],
  "meta": {
    "current_page": 6,
    "last_page": 6,
    "per_page": 1,
    "total": 6
  }
}
```

### GET /me/notifications?unread=1 (Mandor)

Status 200.

```json
{
  "data": [
    {
      "id": 26,
      "type": {
        "code": "penarikan_diajukan",
        "label": "Penarikan"
      },
      "title": "Penarikan dana diajukan",
      "body": "Dewi mengajukan penarikan Rp 50.000,00 dari dana Mandor.",
      "created_at": "2026-10-10T12:54:00+07:00",
      "is_read": false,
      "read_at": null,
      "target": {
        "screen": "team_withdrawal",
        "id": 6
      },
      "data": {
        "worker_id": 6
      }
    },
    {
      "id": 24,
      "type": {
        "code": "penarikan_diajukan",
        "label": "Penarikan"
      },
      "title": "Penarikan dana diajukan",
      "body": "Siti mengajukan penarikan Rp 60.000,00 dari dana Mandor.",
      "created_at": "2026-10-10T12:54:00+07:00",
      "is_read": false,
      "read_at": null,
      "target": {
        "screen": "team_withdrawal",
        "id": 5
      },
      "data": {
        "worker_id": 4
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 20,
    "total": 2
  }
}
```

### GET /me/notifications?unread=1 (Kepala Pencuci)

Status 200.

```json
{
  "data": [
    {
      "id": 13,
      "type": {
        "code": "pengajuan_baru",
        "label": "Pengajuan Baru"
      },
      "title": "Pengajuan baru",
      "body": "Dewi mengajukan ambil kerja ulang 40 pcs tanggal 10/10/2026.",
      "created_at": "2026-10-10T12:53:57+07:00",
      "is_read": false,
      "read_at": null,
      "target": {
        "screen": "approval",
        "id": 4
      },
      "data": {
        "submission_type": "ambil_kerja_ulang",
        "worker_id": 6
      }
    },
    {
      "id": 11,
      "type": {
        "code": "pengajuan_baru",
        "label": "Pengajuan Baru"
      },
      "title": "Pengajuan baru",
      "body": "Rina mengajukan ambil bahan 450 gr tanggal 10/10/2026.",
      "created_at": "2026-10-10T12:53:57+07:00",
      "is_read": false,
      "read_at": null,
      "target": {
        "screen": "approval",
        "id": 3
      },
      "data": {
        "submission_type": "ambil_bahan",
        "worker_id": 5
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 20,
    "total": 2
  }
}
```

### GET /me/notifications (Pencuci, kerja ulang dan upah)

Status 200.

```json
{
  "data": [
    {
      "id": 17,
      "type": {
        "code": "upah_dihitung",
        "label": "Upah"
      },
      "title": "Upah dihitung",
      "body": "Upah 1 kartu periode 28/09/2026 s.d. 04/10/2026 sudah dihitung: Rp 986.000,00.",
      "created_at": "2026-10-10T12:53:57+07:00",
      "is_read": false,
      "read_at": null,
      "target": {
        "screen": "earnings",
        "id": 3
      },
      "data": {
        "period_start": "2026-09-28",
        "period_end": "2026-10-04",
        "cards": 1
      }
    },
    {
      "id": 5,
      "type": {
        "code": "kerja_ulang_baru",
        "label": "Kerja Ulang"
      },
      "title": "Kerja ulang baru",
      "body": "Hasil kartu 09/10/2026 belum standar, ambil kerja ulang 40 pcs.",
      "created_at": "2026-10-10T12:53:57+07:00",
      "is_read": true,
      "read_at": "2026-10-10T12:54:00+07:00",
      "target": {
        "screen": "rework",
        "id": 1
      },
      "data": {
        "daily_work_card_id": 18
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 20,
    "total": 2
  }
}
```

### GET /me/notifications/unread-count

Status 200.

```json
{
  "data": {
    "unread": 2
  }
}
```

### POST /me/notifications/{id}/read

Status 200.

```json
{
  "data": {
    "id": 25,
    "type": {
      "code": "penarikan_ditolak",
      "label": "Penarikan"
    },
    "title": "Penarikan ditolak",
    "body": "Penarikan Rp 60.000,00 ditolak: Tunggu akhir minggu.",
    "created_at": "2026-10-10T12:54:00+07:00",
    "is_read": true,
    "read_at": "2026-10-10T12:54:32+07:00",
    "target": {
      "screen": "withdrawal",
      "id": 5
    },
    "data": {}
  }
}
```

### POST /me/notifications/{id}/read (notifikasi orang lain)

Status 404.

```json
{
  "message": "Data tidak ditemukan."
}
```

### POST /me/notifications/read-all

Status 200.

```json
{
  "data": {
    "updated": 1,
    "unread": 0
  }
}
```

### GET /meta (tanpa login, Tahap 15D)

Status 200.

```json
{
  "data": {
    "api_version": "1.0",
    "min_app_version": "1.0.0",
    "server_time": "2026-10-10T12:54:32+07:00",
    "timezone": "Asia/Jakarta",
    "settings": {
      "photo_max_kb": 2048,
      "photo_types": [
        "image/jpeg",
        "image/png",
        "image/webp"
      ],
      "photo_url_minutes": 15,
      "attendance_radius_m": 100,
      "week_starts_on": "monday",
      "show_daily_profit": true,
      "weighing_confirm_hours": 24,
      "min_withdrawal": "50000.00",
      "thr_percent": "8.00",
      "work_days_per_week": 6,
      "monthly_accrual_days": 24,
      "history_max_days": 62,
      "per_page_max": 100,
      "idempotency_header": "Idempotency-Key",
      "idempotency_ttl_hours": 24
    },
    "company": {
      "name": "PT. Sarang Natural Indonesia",
      "phone": null,
      "admin_whatsapp": "6281234567890"
    }
  }
}
```
