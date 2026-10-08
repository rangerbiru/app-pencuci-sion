import { api, unwrapData } from './api/api';
import { MyRation, Rework, Submission, WorkCard, WorkDay } from '@/types';

export const workApi = api.injectEndpoints({
  endpoints: build => ({
    getMyRations: build.query<MyRation[], void>({
      query: () => ({ path: '/me/rations' }),
      transformResponse: unwrapData<MyRation[]>,
      providesTags: ['Rations'],
    }),
    getWorkToday: build.query<WorkDay, void>({
      query: () => ({ path: '/work/today' }),
      transformResponse: unwrapData<WorkDay>,
      providesTags: ['WorkToday'],
    }),
    getWorkHistory: build.query<WorkDay[], { from?: string; to?: string } | void>({
      query: args => ({ path: '/work/history', params: args ?? undefined }),
      transformResponse: unwrapData<WorkDay[]>,
      providesTags: ['WorkHistory'],
    }),
    cancelSubmission: build.mutation<Submission, number>({
      query: id => ({ path: `/work/submissions/${id}/cancel`, method: 'POST' }),
      transformResponse: unwrapData<Submission>,
      invalidatesTags: ['WorkToday', 'WorkHistory', 'Rations'],
    }),
    getMyRework: build.query<Rework[], void>({
      query: () => ({ path: '/me/rework' }),
      transformResponse: unwrapData<Rework[]>,
      providesTags: ['Rework'],
    }),
    getMyWeighings: build.query<WorkCard[], void>({
      query: () => ({ path: '/me/weighings' }),
      transformResponse: unwrapData<WorkCard[]>,
      providesTags: ['Weighings'],
    }),
  }),
});

export const {
  useGetMyRationsQuery,
  useGetWorkTodayQuery,
  useGetWorkHistoryQuery,
  useCancelSubmissionMutation,
  useGetMyReworkQuery,
  useGetMyWeighingsQuery,
} = workApi;
