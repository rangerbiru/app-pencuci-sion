/**
 * Bentuk data API mobile SION v1 (docs/API_MOBILE.md). Uang dan gram = string desimal.
 */

/** "6500000.00" */
export type Decimal = string;
/** "2026-10-05T07:58:12+07:00" */
export type IsoDateTime = string;
/** "2026-10-05" */
export type IsoDate = string;

export interface Status<C extends string = string> {
  code: C;
  label: string;
}

export interface Ref {
  id: number;
  name: string;
}

export interface Envelope<T> {
  data: T;
}

export interface PageMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

// ---------- Meta & auth ----------

export interface Meta {
  api_version: string;
  min_app_version: string;
  server_time: IsoDateTime;
  timezone: string;
  settings: {
    photo_max_kb: number;
    photo_types: string[];
    attendance_radius_m: number;
    week_starts_on: string;
    photo_url_minutes?: number;
    show_daily_profit?: boolean;
    weighing_confirm_hours?: number;
    min_withdrawal?: Decimal;
    thr_percent?: Decimal;
    work_days_per_week?: number;
    monthly_accrual_days?: number;
    history_max_days?: number;
    per_page_max?: number;
    idempotency_header?: string;
    idempotency_ttl_hours?: number;
  };
  /** Tahap 15C: identitas perusahaan; admin_whatsapp null = sembunyikan Hubungi Admin */
  company?: {
    name: string;
    phone: string | null;
    admin_whatsapp: string | null;
  };
}

export type RoleCode = 'pencuci' | 'kepala_pencuci' | 'mandor';

export interface Me {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: Status<RoleCode>;
  photo_url: string | null;
  kepala_pencuci: Ref | null;
  mandor: Ref | null;
  location: Ref | null;
  contract: {
    id: number;
    peran: string;
    effective_date: IsoDate;
    location: string | null;
    components: Record<string, boolean>;
    /** GET /me mengirim kode polos: 'borongan' atau 'mandiri' */
    skema?: 'borongan' | 'mandiri' | string | null;
  } | null;
}

export interface LoginResponse {
  token: string;
  token_type: 'Bearer';
  user: Me;
}

// ---------- Absen ----------

export interface AttendanceMark {
  at: IsoDateTime | null;
  photo_url: string | null;
  photo_taken_at: IsoDateTime | null;
  distance_m: number | null;
  location_flag: Status | null;
}

export interface Attendance {
  id: number;
  date: IsoDate;
  status: Status;
  source: Status;
  location: string | null;
  check_in: AttendanceMark;
  check_out: AttendanceMark;
}

// ---------- Kerja harian ----------

export interface MyRation {
  batch_assignment_id: number;
  batch_code: string;
  item: string;
  target_gram: Decimal;
  taken_gram: Decimal;
  pending_gram: Decimal;
  remaining_gram: Decimal;
  taken_pcs: number | null;
  status: Status;
}

export type SubmissionType =
  | 'ambil_bahan'
  | 'serah_lembab'
  | 'ambil_kerja_ulang'
  | 'serah_kerja_ulang';

export interface Submission {
  id: number;
  type: Status<SubmissionType>;
  status: Status<'menunggu' | 'disetujui' | 'ditolak' | 'dibatalkan'>;
  work_date: IsoDate;
  worker: Ref;
  batch_assignment_id: number | null;
  batch_code: string | null;
  item: string | null;
  gram: Decimal | null;
  pcs: number | null;
  photo_url: string | null;
  photo_taken_at: IsoDateTime | null;
  submitted_at: IsoDateTime;
  decided_by: Ref | string | null;
  decided_at: IsoDateTime | null;
  reject_reason: string | null;
  daily_work_card_id: number | null;
  rework_item_id?: number | null;
}

export interface WeighingConfirmation {
  status: Status<'menunggu' | 'setuju' | 'tidak_setuju' | 'otomatis'>;
  requested_at: IsoDateTime | null;
  deadline: IsoDateTime | null;
  answered_at: IsoDateTime | null;
  reason: string | null;
}

export interface CardWage {
  status: Status<'tertahan' | 'belum_dihitung' | 'sudah_dihitung'>;
  amount: Decimal | null;
  reason: string | null;
  calculation_id: number | null;
}

export interface WorkCardResultRow {
  item_id: number;
  item: string;
  group: string;
  pcs_lembab: number | null;
  gram: Decimal | null;
  pcs: number | null;
  retur_tujuan: string | null;
}

export interface WorkCard {
  id: number;
  work_date: IsoDate;
  worker: Ref;
  location: string | null;
  status: Status;
  qc_status: Status<'standard' | 'belum_standard'> | null;
  rework_date: IsoDate | null;
  verified: boolean;
  verified_at: IsoDateTime | null;
  verified_by: Ref | string | null;
  material: {
    gram: Decimal;
    pcs: number | null;
    rows: {
      batch_assignment_id: number;
      batch_code: string;
      item: string;
      gram: Decimal;
      pcs: number | null;
    }[];
  };
  pcs_lembab: number | null;
  result: {
    gram: Decimal | null;
    groups: { group: string; gram: Decimal; pcs: number | null }[];
    rows: WorkCardResultRow[];
  };
  wage: CardWage | null;
  weighing_confirmation?: WeighingConfirmation | null;
}

export interface WorkDay {
  date: IsoDate;
  card: WorkCard | null;
  submissions: Submission[];
  pending_count: number;
}

export interface Rework {
  id: number;
  daily_work_card_id: number;
  card_date: IsoDate;
  rework_date: IsoDate | null;
  pcs: number | null;
  gram: Decimal | null;
  status: Status<'menunggu_diambil' | 'diambil' | 'diserahkan' | 'selesai' | 'dibatalkan'>;
  taken_pcs: number | null;
  taken_at: IsoDateTime | null;
  returned_pcs: number | null;
  returned_at: IsoDateTime | null;
}

// ---------- Pendapatan ----------

export interface BonusInfo {
  status: Status<'capai' | 'pending' | 'tidak_dibayar' | 'tidak_ada'>;
  amount: Decimal | null;
  achieved_gram?: Decimal | null;
  target_gram?: Decimal | null;
  finished?: boolean;
  unit?: 'gram' | 'anggota';
}

export interface EarningsDay {
  date: IsoDate;
  attendance: Status | null;
  present: boolean;
  material_gram: Decimal;
  material_pcs: number | null;
  pcs_lembab: number | null;
  result_gram: Decimal;
  gaji_harian: Decimal;
  upah_sudah_dihitung: Decimal;
  cards: { id: number; worker: number; status: Status; wage: CardWage | null }[];
}

export interface Earnings {
  week: string;
  from: IsoDate;
  to: IsoDate;
  finished: boolean;
  paid_by: Status<'sion' | 'mandor'>;
  present_days: number;
  material_gram: Decimal;
  upah_bahan: Decimal;
  upah_hasil: Decimal;
  upah_qc: Decimal;
  upah_by_status: { tertahan: Decimal; belum_dihitung: Decimal; sudah_dihitung: Decimal };
  gaji_harian: Decimal;
  bonus_mingguan: BonusInfo;
  total: Decimal;
  days: EarningsDay[];
}

export interface PendingItem {
  kind: 'bonus_mingguan' | 'bonus_bulanan' | 'thr' | 'upah' | string;
  label: string;
  amount: Decimal | null;
  full_amount?: Decimal | null;
  status: Status;
  reason: string | null;
  rule: string | null;
  progress: {
    achieved?: Decimal;
    target?: Decimal;
    present_days?: number;
    unit?: 'gram' | 'anggota';
    ppe?: Decimal;
    base?: Decimal;
  } | null;
  daily_work_card_id: number | null;
}

export interface Withdrawal {
  id: number;
  amount: Decimal;
  status: Status<'diajukan' | 'disetujui' | 'dibayar' | 'ditolak' | 'dibatalkan'>;
  notes: string | null;
  method: string | null;
  reject_reason: string | null;
  requested_at: IsoDateTime;
  approved_at: IsoDateTime | null;
  paid_at: IsoDateTime | null;
  rejected_at: IsoDateTime | null;
  cancelled_at: IsoDateTime | null;
  funded_by?: Status | null;
  worker?: Ref;
}

export interface Balance {
  paid_by: Status<'sion' | 'mandor'>;
  dapat_dicairkan: Decimal;
  pending: Decimal;
  thr_ditahan: Decimal;
  thr_by_contract_year: { contract_year: number; amount: Decimal }[];
  pending_items: PendingItem[];
  ledger: {
    id: number;
    at: IsoDateTime;
    bucket: Status;
    kind: Status;
    amount: Decimal;
    period_start: IsoDate | null;
    period_end: IsoDate | null;
    contract_year: number | null;
    description: string | null;
  }[];
  withdrawal: { can_withdraw: boolean; min_amount: Decimal; active: Withdrawal | null };
  mandor_funds?: { mandor: Ref; dapat_dicairkan: Decimal; thr_ditahan: Decimal }[];
}

export interface BonusesSummary {
  paid_by?: Status<'sion' | 'mandor'>;
  weekly: (BonusInfo & { week: string; from?: IsoDate })[];
  monthly: (BonusInfo & {
    month: string;
    rule?: string | null;
    ppe?: Decimal | null;
    complete?: boolean;
    finished?: boolean;
  })[];
}

export interface DailyProfit {
  date: IsoDate;
  cards: number;
  nilai_jual: Decimal;
  hpp_bahan: Decimal;
  upah: Decimal;
  laba: Decimal;
  persen: Decimal | null;
  complete: boolean;
  members?: (Omit<DailyProfit, 'members' | 'date'> & { user: Ref })[];
}

export interface DailyProfitResponse {
  data: DailyProfit[];
  meta: { from: IsoDate; to: IsoDate };
}

// ---------- Tim ----------

export interface TeamMember {
  id: number;
  name: string;
  role: Status<RoleCode>;
  atasan: Ref | string | null;
  attendance_today: {
    status: Status | null;
    /** "HH:MM" */
    check_in?: string | null;
    check_out?: string | null;
    check_in_at: IsoDateTime | null;
    check_out_at: IsoDateTime | null;
    location_flag: Status | null;
  } | null;
  /** jatah aktif: hanya kode batch dan sisa gram (tanpa item/target) */
  rations: {
    batch_assignment_id: number;
    batch_code: string;
    remaining_gram: Decimal;
  }[];
  card_today: {
    id?: number;
    status: Status | null;
    material_gram: Decimal | null;
    result_gram: Decimal | null;
    pcs_lembab: number | null;
  } | null;
  pending_submissions: number;
}

// ---------- Batch, penjatahan, wadah ----------

export interface Batch {
  id: number;
  batch_code: string;
  kode_stok: string | null;
  item: string;
  grades: number[];
  mandor: string | null;
  status: Status<'assigned' | 'received' | 'in_progress' | 'completed'>;
  sent_gram: Decimal;
  nilai_hpp: Decimal | null;
  received_at: IsoDateTime | null;
  received_gram: Decimal | null;
  received_pcs: number | null;
  receipt_shrink_gram: Decimal | null;
  receipt_notes: string | null;
  receipt_photo_url: string | null;
  remaining_gram: Decimal | null;
  can_prepare: boolean;
}

export interface RationBatch extends Batch {
  assignments: {
    id: number;
    worker: Ref;
    target_gram: Decimal;
    modal_bahan: Decimal | null;
    status: Status;
  }[];
}

export interface Container {
  kode: string;
  jenis: Status;
  nama: string;
  tara_gram: Decimal;
  status: Status;
  usable: boolean;
  isi_kode_stok: string | null;
}

// ---------- Tahap 15C ----------

export type ItemJenis = 'bahan_baku' | 'hasil_produksi' | 'sampingan' | 'bahan_kotor';

/** GET /items: item aktif ringkas. Item tidak punya grade. */
export interface Item {
  id: number;
  kode: string | null;
  name: string;
  jenis: Status<ItemJenis>;
  /** hanya hasil produksi: utuh / kecil / hancur */
  grup_hasil: Status<'utuh' | 'kecil' | 'hancur'> | null;
  warna: string | null;
  unit: string;
}

/** GET /approvals/{id}: objek pengajuan + foto, jatah, kerja ulang, kartu. */
export interface SubmissionDetail extends Submission {
  photo: { url: string | null; taken_at: IsoDateTime | null } | null;
  ration: {
    batch_assignment_id: number;
    target_gram: Decimal;
    taken_gram: Decimal;
    pending_other_gram: Decimal;
    remaining_gram: Decimal;
  } | null;
  rework: Rework | null;
  card: WorkCard | null;
}

export interface MemberBonusProgress {
  user: Ref;
  kepala_pencuci: Ref | null;
  paid_by: Status<'sion' | 'mandor'>;
  target_gram_per_day: Decimal | null;
  weekly: {
    status: BonusInfo['status'];
    amount: Decimal | null;
    target_gram: Decimal | null;
    achieved_gram: Decimal | null;
    achieved: boolean;
    finished: boolean;
  };
  monthly: {
    status: BonusInfo['status'];
    amount: Decimal | null;
    ppe: Decimal | null;
    cards: number;
    complete: boolean;
    notes: string[];
    finished: boolean;
  };
}

export interface KepalaBonusProgress {
  user: Ref;
  weekly: {
    status: BonusInfo['status'];
    amount: Decimal | null;
    members_achieved: number;
    members_active: number;
    finished: boolean;
  };
  monthly: {
    status: BonusInfo['status'];
    amount: Decimal | null;
    team_ppe: Decimal | null;
    members: number;
    members_positive: number;
    complete: boolean;
    finished: boolean;
  };
}

/** GET /team/bonus-progress */
export interface TeamBonusProgress {
  week: string;
  from: IsoDate;
  to: IsoDate;
  week_finished: boolean;
  month: string;
  month_finished: boolean;
  members: MemberBonusProgress[];
  kepala: KepalaBonusProgress[];
}

/** GET /mandor/funds: saldo dana Mandor per pencuci Borongan. */
export interface MandorFunds {
  workers: {
    worker: Ref;
    in_team: boolean;
    dapat_dicairkan: Decimal;
    thr_ditahan: Decimal;
    /** nominal pengajuan Diajukan atau Disetujui */
    withdrawal_active: Decimal;
  }[];
  total: {
    dapat_dicairkan: Decimal;
    thr_ditahan: Decimal;
    withdrawal_active: Decimal;
    workers: number;
  };
}

/** POST /batches/{id}/preparation (201) */
export interface PreparationResult {
  preparation_id: number;
  input_gram: Decimal;
  output_gram: Decimal;
  susut_gram: Decimal;
  batches: Batch[];
}
