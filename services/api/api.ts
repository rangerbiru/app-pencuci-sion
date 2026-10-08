import { createApi, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { ApiError } from './errors';
import { http, HttpRequest } from './http';

/**
 * baseQuery RTK Query di atas klien http(). Respons sukses dikembalikan apa adanya
 * (endpoint memilih `data` atau `{data, meta}` lewat transformResponse).
 */
const baseQuery: BaseQueryFn<HttpRequest | string, unknown, ApiError> = async args => {
  const req = typeof args === 'string' ? { path: args } : args;
  const result = await http<unknown>(req);
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
