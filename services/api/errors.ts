import type { NetworkCause } from './networkDiagnosis';

/**
 * Error API yang sudah dinormalkan supaya layar cukup membaca `message` dan `fieldErrors`.
 */
export type ApiErrorKind = 'network' | 'timeout' | 'http';

export interface ApiError {
  kind: ApiErrorKind;
  status: number | null;
  message: string;
  /** 422: pesan per isian, mis. { weight: "Gram melebihi sisa jatah ..." } */
  fieldErrors: Record<string, string>;
  /** 429: detik tunggu dari header Retry-After */
  retryAfter?: number;
  /** __DEV__: penyebab galat koneksi (lihat networkDiagnosis.ts) */
  cause?: NetworkCause;
}

export const NETWORK_MESSAGE =
  'Tidak ada sinyal atau server tidak bisa dihubungi. Periksa internet, lalu coba lagi.';
export const TIMEOUT_MESSAGE = 'Server terlalu lama menjawab. Coba lagi sebentar lagi.';

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Sesi Anda berakhir. Silakan masuk lagi.',
  403: 'Anda tidak punya akses untuk data ini.',
  404: 'Data tidak ditemukan. Mungkin sudah dihapus.',
  409: 'Data sudah berubah. Muat ulang lalu coba lagi.',
  422: 'Ada isian yang belum benar.',
  429: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
  500: 'Terjadi gangguan di server. Coba lagi nanti.',
};

export function messageForStatus(status: number): string {
  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  if (status >= 500) return STATUS_MESSAGES[500];
  return 'Permintaan gagal. Coba lagi.';
}

interface LaravelErrorBody {
  message?: unknown;
  errors?: Record<string, unknown>;
}

/** Ubah respons gagal Laravel menjadi ApiError. `errors.a.b` tetap memakai kunci titik. */
export function httpError(status: number, body: unknown, retryAfter?: number): ApiError {
  const b = (body && typeof body === 'object' ? body : {}) as LaravelErrorBody;
  const fieldErrors: Record<string, string> = {};
  if (b.errors && typeof b.errors === 'object') {
    for (const [key, val] of Object.entries(b.errors)) {
      const first = Array.isArray(val) ? val[0] : val;
      if (typeof first === 'string') fieldErrors[key] = first;
    }
  }
  const message =
    typeof b.message === 'string' && b.message.trim() && !/^Server Error$/i.test(b.message)
      ? b.message
      : messageForStatus(status);
  return { kind: 'http', status, message, fieldErrors, retryAfter };
}

export function isApiError(e: unknown): e is ApiError {
  return !!e && typeof e === 'object' && 'kind' in e && 'message' in e && 'fieldErrors' in e;
}

/** Ambil ApiError dari hasil RTK Query / unwrap(). */
export function toApiError(e: unknown): ApiError {
  if (isApiError(e)) return e;
  const inner = (e as { data?: unknown; error?: unknown } | null)?.data;
  if (isApiError(inner)) return inner;
  return { kind: 'network', status: null, message: NETWORK_MESSAGE, fieldErrors: {} };
}

/** Error yang layak dicoba ulang otomatis (antrean kirim ulang). */
export function isRetryable(e: ApiError): boolean {
  if (e.kind !== 'http') return true;
  return e.status === 408 || e.status === 429 || (e.status ?? 0) >= 500;
}
