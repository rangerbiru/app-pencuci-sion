import { api, unwrapData } from './api/api';
import { AppNotification, Paginated } from '@/types';

export const notificationsApi = api.injectEndpoints({
  endpoints: build => ({
    getUnreadCount: build.query<number, void>({
      query: () => ({ path: '/me/notifications/unread-count' }),
      transformResponse: (res: { data: { unread: number } }) => res.data.unread,
      providesTags: ['Notifications'],
    }),
    getNotifications: build.query<Paginated<AppNotification>, { page?: number } | void>({
      query: args => ({
        path: '/me/notifications',
        params: { per_page: 20, page: args?.page ?? 1 },
      }),
      providesTags: ['Notifications'],
    }),
    markNotificationRead: build.mutation<AppNotification, number>({
      query: id => ({ path: `/me/notifications/${id}/read`, method: 'POST' }),
      transformResponse: unwrapData<AppNotification>,
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: build.mutation<{ updated: number; unread: number }, void>({
      query: () => ({ path: '/me/notifications/read-all', method: 'POST' }),
      transformResponse: unwrapData<{ updated: number; unread: number }>,
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const {
  useGetUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
