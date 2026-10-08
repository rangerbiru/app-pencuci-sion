import { api, unwrapData } from './api/api';
import {
  Balance,
  BonusesSummary,
  DailyProfitResponse,
  Earnings,
  Paginated,
  Withdrawal,
} from '@/types';

export const earningsApi = api.injectEndpoints({
  endpoints: build => ({
    getEarnings: build.query<Earnings, string | void>({
      query: week => ({ path: '/me/earnings', params: week ? { week } : undefined }),
      transformResponse: unwrapData<Earnings>,
      providesTags: ['Earnings'],
    }),
    getBalance: build.query<Balance, void>({
      query: () => ({ path: '/me/balance' }),
      transformResponse: unwrapData<Balance>,
      providesTags: ['Balance'],
    }),
    getBonuses: build.query<BonusesSummary, void>({
      query: () => ({ path: '/me/bonuses' }),
      transformResponse: unwrapData<BonusesSummary>,
      providesTags: ['Bonuses'],
    }),
    getMyDailyProfit: build.query<DailyProfitResponse, { from?: string; to?: string } | void>({
      query: args => ({ path: '/me/daily-profit', params: args ?? undefined }),
      providesTags: ['DailyProfit'],
    }),
    getWithdrawals: build.query<Paginated<Withdrawal>, number | void>({
      query: page => ({ path: '/me/withdrawals', params: { page: page ?? 1, per_page: 20 } }),
      providesTags: ['Withdrawals'],
    }),
    createWithdrawal: build.mutation<Withdrawal, { amount: string; notes?: string }>({
      query: body => ({ path: '/me/withdrawals', method: 'POST', body }),
      transformResponse: unwrapData<Withdrawal>,
      invalidatesTags: ['Withdrawals', 'Balance'],
    }),
    cancelWithdrawal: build.mutation<Withdrawal, number>({
      query: id => ({ path: `/me/withdrawals/${id}/cancel`, method: 'POST' }),
      transformResponse: unwrapData<Withdrawal>,
      invalidatesTags: ['Withdrawals', 'Balance'],
    }),
  }),
});

export const {
  useGetEarningsQuery,
  useGetBalanceQuery,
  useGetBonusesQuery,
  useGetMyDailyProfitQuery,
  useGetWithdrawalsQuery,
  useCreateWithdrawalMutation,
  useCancelWithdrawalMutation,
} = earningsApi;
