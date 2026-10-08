import { api, unwrapData } from './api/api';
import { http } from './api/http';
import { Batch, Container, RationBatch } from '@/types';

export const batchesApi = api.injectEndpoints({
  endpoints: build => ({
    getIncomingBatches: build.query<Batch[], void>({
      query: () => ({ path: '/batches/incoming' }),
      transformResponse: unwrapData<Batch[]>,
      providesTags: ['Batches'],
    }),
    getRationBatches: build.query<RationBatch[], void>({
      query: () => ({ path: '/rations' }),
      transformResponse: unwrapData<RationBatch[]>,
      providesTags: ['RationBatches'],
    }),
    createRations: build.mutation<
      RationBatch,
      { production_batch_id: number; lines: { pencuci_id: number; target_qty: string }[] }
    >({
      query: body => ({ path: '/rations', method: 'POST', body }),
      transformResponse: unwrapData<RationBatch>,
      invalidatesTags: ['RationBatches', 'Team'],
    }),
  }),
});

export const { useGetIncomingBatchesQuery, useGetRationBatchesQuery, useCreateRationsMutation } =
  batchesApi;

/** Hasil scan QR berisi URL `/wadah/{kode}`; ambil kode di akhir URL. */
export function containerCodeFromScan(raw: string): string {
  const trimmed = raw.trim();
  const m = /\/wadah\/([^/?#\s]+)/i.exec(trimmed);
  return decodeURIComponent(m ? m[1] : trimmed).toUpperCase();
}

export function fetchContainer(kode: string) {
  return http<{ data: Container }>({ path: `/containers/${encodeURIComponent(kode)}` });
}
