import { api, unwrapData } from './api/api';
import { buildFormData, UploadFile } from './api/multipart';
import {
  DailyProfitResponse,
  MandorFunds,
  Paginated,
  Submission,
  SubmissionDetail,
  TeamBonusProgress,
  TeamMember,
  Withdrawal,
} from '@/types';

export const teamApi = api.injectEndpoints({
  endpoints: build => ({
    getTeam: build.query<TeamMember[], void>({
      query: () => ({ path: '/team' }),
      transformResponse: unwrapData<TeamMember[]>,
      providesTags: ['Team'],
    }),
    getApprovals: build.query<
      Paginated<Submission>,
      { status?: string; date?: string; page?: number } | void
    >({
      query: args => ({
        path: '/approvals',
        params: { status: 'menunggu', per_page: 50, ...(args ?? {}) },
      }),
      providesTags: ['Approvals'],
    }),
    getApprovalDetail: build.query<SubmissionDetail, number>({
      query: id => ({ path: `/approvals/${id}` }),
      transformResponse: unwrapData<SubmissionDetail>,
      providesTags: (_r, _e, id) => [{ type: 'Approvals', id }],
    }),
    getTeamBonusProgress: build.query<TeamBonusProgress, { week?: string; month?: string } | void>({
      query: args => ({ path: '/team/bonus-progress', params: args ?? undefined }),
      transformResponse: unwrapData<TeamBonusProgress>,
      providesTags: ['BonusProgress'],
    }),
    getMandorFunds: build.query<MandorFunds, void>({
      query: () => ({ path: '/mandor/funds' }),
      transformResponse: unwrapData<MandorFunds>,
      providesTags: ['MandorFunds'],
    }),
    approveSubmission: build.mutation<Submission, number>({
      query: id => ({ path: `/approvals/${id}/approve`, method: 'POST' }),
      transformResponse: unwrapData<Submission>,
      invalidatesTags: ['Approvals', 'Team', 'WorkCards', 'BonusProgress'],
    }),
    rejectSubmission: build.mutation<Submission, { id: number; reason: string }>({
      query: ({ id, reason }) => ({
        path: `/approvals/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      transformResponse: unwrapData<Submission>,
      invalidatesTags: ['Approvals', 'Team'],
    }),
    getTeamDailyProfit: build.query<DailyProfitResponse, { from?: string; to?: string } | void>({
      query: args => ({ path: '/team/daily-profit', params: args ?? undefined }),
      providesTags: ['DailyProfit'],
    }),
    getTeamWithdrawals: build.query<Paginated<Withdrawal>, { status?: string } | void>({
      query: args => ({ path: '/team/withdrawals', params: { per_page: 50, ...(args ?? {}) } }),
      providesTags: ['TeamWithdrawals'],
    }),
    approveTeamWithdrawal: build.mutation<Withdrawal, number>({
      query: id => ({ path: `/team/withdrawals/${id}/approve`, method: 'POST' }),
      transformResponse: unwrapData<Withdrawal>,
      invalidatesTags: ['TeamWithdrawals'],
    }),
    rejectTeamWithdrawal: build.mutation<Withdrawal, { id: number; reason: string }>({
      query: ({ id, reason }) => ({
        path: `/team/withdrawals/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      transformResponse: unwrapData<Withdrawal>,
      invalidatesTags: ['TeamWithdrawals'],
    }),
    payTeamWithdrawal: build.mutation<
      Withdrawal,
      { id: number; method: 'tunai' | 'transfer'; proof?: UploadFile }
    >({
      query: ({ id, method, proof }) => ({
        path: `/team/withdrawals/${id}/pay`,
        method: 'POST',
        body: buildFormData({ method }, { proof }),
        timeoutMs: 60000,
      }),
      transformResponse: unwrapData<Withdrawal>,
      invalidatesTags: ['TeamWithdrawals', 'MandorFunds'],
    }),
  }),
});

export const {
  useGetTeamQuery,
  useGetApprovalsQuery,
  useGetApprovalDetailQuery,
  useGetTeamBonusProgressQuery,
  useGetMandorFundsQuery,
  useApproveSubmissionMutation,
  useRejectSubmissionMutation,
  useGetTeamDailyProfitQuery,
  useGetTeamWithdrawalsQuery,
  useApproveTeamWithdrawalMutation,
  useRejectTeamWithdrawalMutation,
  usePayTeamWithdrawalMutation,
} = teamApi;
