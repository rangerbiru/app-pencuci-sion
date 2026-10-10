import { ApiError, toApiError } from './errors';

interface QueryLike {
  error?: unknown;
  data?: unknown;
}

/**
 * Error penyegaran: kueri gagal diambil ulang tetapi isi lamanya masih ada. Layar tetap
 * menampilkan isi lama dan memberi pesan singkat + Coba lagi (Screen `refreshError`).
 */
export function staleError(...queries: QueryLike[]): ApiError | null {
  const q = queries.find(x => x.error && x.data !== undefined);
  return q ? toApiError(q.error) : null;
}

interface ArgQueryLike {
  data?: unknown;
  currentData?: unknown;
  isLoading: boolean;
  isFetching: boolean;
}

/**
 * Untuk layar yang argumennya berganti (tanggal, minggu, filter): RTK Query tetap memberi `data`
 * argumen sebelumnya selama memuat. Pakai `currentData` dan anggap memuat (skeleton) sampai data
 * argumen baru datang, supaya tidak tampil "0 kartu" untuk tanggal yang salah. Menyegarkan
 * argumen yang sama tetap memperlihatkan isi lama.
 */
export function forCurrentArg<Q extends ArgQueryLike>(q: Q): Q {
  return {
    ...q,
    data: q.currentData,
    isLoading: q.isLoading || (q.isFetching && q.currentData === undefined),
  };
}
