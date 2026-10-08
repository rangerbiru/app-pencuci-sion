import { createApi, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { ApiError } from './errors';
import { http, HttpRequest } from './http';
import { keyFor, needsKey, settle } from './idempotency';

/**
 * baseQuery RTK Query di atas klien http(). Respons sukses dikembalikan apa adanya
 * (endpoint memilih `data` atau `{data, meta}` lewat transformResponse).
 * POST/PUT otomatis membawa Idempotency-Key (lihat idempotency.ts).
 */
const baseQuery: BaseQueryFn<HttpRequest | string, unknown, ApiError> = async args => {
  const req: HttpRequest = typeof args === 'string' ? { path: args } : args;
  if (!needsKey(req)) {
    const result = await http<unknown>(req);
    return result.ok ? { data: result.data } : { error: result.error };
  }
  // aksi tulis: Idempotency-Key per aksi, dipakai ulang bila kiriman tidak terjawab
  const result = await http<unknown>({ ...req, idempotencyKey: keyFor(req) });
  settle(req, result.ok ? null : result.error);
  return result.ok ? { data: result.data } : { error: result.error };
};

export const tagTypes = [
  'Me',
  'Attendance',
  'Rations',
  'WorkToday',
  'WorkHistory',
  'Rework',
  'Weighings',
  'Earnings',
  'Balance',
  'Bonuses',
  'DailyProfit',
  'Withdrawals',
  'Team',
  'Approvals',
  'WorkCards',
  'Batches',
  'RationBatches',
  'TeamWithdrawals',
  'Items',
  'BonusProgress',
  'MandorFunds',
] as const;

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes,
  // data ringan; HP kelas bawah: simpan cache 5 menit, segarkan saat layar dibuka lagi
  keepUnusedDataFor: 300,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});

/** Ambil `data` dari amplop `{ data }`. */
export const unwrapData = <T>(res: unknown): T => (res as { data: T }).data;
