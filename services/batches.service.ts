import { api, unwrapData } from './api/api';
import { http } from './api/http';
import { Batch, Container, Item, Paginated, RationBatch } from '@/types';

export interface PreparationPayload {
  prepared_at: string;
  process_type: 'kering' | 'basah';
  notes?: string | null;
  /** gram G1 hasil timbang; item G1 bawaan = item batch (g1_item_id tidak dikirim) */
  g1_gram: string;
  g1_pcs?: number | null;
  /** susut hancur, boleh kosong */
  crushed: { item_id: number; gram: string; pcs?: number | null }[];
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
      { purpose?: 'penyiapan' | 'kartu_kerja'; jenis?: string; crushed?: 0 | 1; q?: string }
    >({
      query: params => ({ path: '/items', params: { per_page: 200, ...params } }),
      providesTags: ['Items'],
      // daftar item jarang berubah
      keepUnusedDataFor: 1800,
    }),
  }),
});

export const {
  useGetIncomingBatchesQuery,
  useGetRationBatchesQuery,
  useCreateRationsMutation,
  useGetItemsQuery,
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
