import { api, unwrapData } from './api/api';
import { http } from './api/http';
import { Batch, Container, Item, Paginated, PreparationResult, RationBatch } from '@/types';

export interface PreparationPayload {
  prepared_at: string;
  process_type: 'kering' | 'basah';
  notes?: string | null;
  outputs: { item_id: number; weight: string; jumlah_keping?: number | null }[];
}

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
    getItems: build.query<
      Paginated<Item>,
      { purpose?: 'penyiapan' | 'kartu_kerja'; jenis?: string; q?: string }
    >({
      query: params => ({ path: '/items', params: { per_page: 200, ...params } }),
      providesTags: ['Items'],
      // daftar item jarang berubah
      keepUnusedDataFor: 1800,
    }),
    prepareBatch: build.mutation<
      PreparationResult,
      { id: number; body: PreparationPayload; idempotencyKey: string }
    >({
      query: ({ id, body, idempotencyKey }) => ({
        path: `/batches/${id}/preparation`,
        method: 'POST',
        body,
        idempotencyKey,
      }),
      transformResponse: unwrapData<PreparationResult>,
      invalidatesTags: ['Batches', 'RationBatches'],
    }),
  }),
});

export const {
  useGetIncomingBatchesQuery,
  useGetRationBatchesQuery,
  useCreateRationsMutation,
  useGetItemsQuery,
  usePrepareBatchMutation,
} = batchesApi;

/** Hasil scan QR berisi URL `/wadah/{kode}`; ambil kode di akhir URL. */
export function containerCodeFromScan(raw: string): string {
  const trimmed = raw.trim();
  const m = /\/wadah\/([^/?#\s]+)/i.exec(trimmed);
  return decodeURIComponent(m ? m[1] : trimmed).toUpperCase();
}

export function fetchContainer(kode: string) {
  return http<{ data: Container }>({ path: `/containers/${encodeURIComponent(kode)}` });
}
