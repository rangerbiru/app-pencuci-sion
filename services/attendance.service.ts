import { api, unwrapData } from './api/api';
import { Attendance } from '@/types';

export const attendanceApi = api.injectEndpoints({
  endpoints: build => ({
    getAttendanceToday: build.query<Attendance | null, void>({
      query: () => ({ path: '/attendance/today' }),
      transformResponse: unwrapData<Attendance | null>,
      providesTags: ['Attendance'],
    }),
  }),
});

export const { useGetAttendanceTodayQuery } = attendanceApi;
