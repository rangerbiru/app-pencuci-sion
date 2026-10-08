import { api, unwrapData } from './api/api';
import { Paginated, WorkCard } from '@/types';

export interface QcOutput {
  item_id: number;
  jumlah_keping_lembab?: number | null;
  weight_clean?: string | null;
  jumlah_keping_clean?: number | null;
  retur_tujuan?: string | null;
  retur_batch_id?: number | null;
}

export interface QcPayload {
  qc_status: 'standard' | 'belum_standard';
  rework_date?: string | null;
  rework_pcs?: number | null;
  rework_gram?: string | null;
  outputs: QcOutput[];
}

export const workCardsApi = api.injectEndpoints({
  endpoints: build => ({
    getWorkCards: build.query<
      Paginated<WorkCard>,
      { date?: string; worker?: number; page?: number }
    >({
      query: params => ({ path: '/work-cards', params: { per_page: 50, ...params } }),
      providesTags: ['WorkCards'],
    }),
    /** Semua kartu yang boleh dilihat, terbaru dulu, per halaman 20 (GET /work-cards tanpa date). */
    getAllWorkCards: build.infiniteQuery<Paginated<WorkCard>, { worker?: number } | void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: last =>
          last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined,
      },
      query: ({ queryArg, pageParam }) => ({
        path: '/work-cards',
        params: { per_page: 20, page: pageParam, ...(queryArg ?? {}) },
      }),
      providesTags: ['WorkCards'],
    }),
    getWorkCard: build.query<WorkCard, number>({
      query: id => ({ path: `/work-cards/${id}` }),
      transformResponse: unwrapData<WorkCard>,
      providesTags: (_r, _e, id) => [{ type: 'WorkCards', id }],
    }),
    submitQc: build.mutation<WorkCard, { id: number; body: QcPayload }>({
      query: ({ id, body }) => ({ path: `/work-cards/${id}/qc`, method: 'POST', body }),
      transformResponse: unwrapData<WorkCard>,
      invalidatesTags: (_r, _e, { id }) => ['WorkCards', { type: 'WorkCards', id }, 'Team'],
    }),
    verifyCard: build.mutation<WorkCard, number>({
      query: id => ({ path: `/work-cards/${id}/verify`, method: 'POST' }),
      transformResponse: unwrapData<WorkCard>,
      invalidatesTags: (_r, _e, id) => ['WorkCards', { type: 'WorkCards', id }],
    }),
  }),
});

export const {
  useGetWorkCardsQuery,
  useGetAllWorkCardsInfiniteQuery,
  useGetWorkCardQuery,
  useSubmitQcMutation,
  useVerifyCardMutation,
} = workCardsApi;
