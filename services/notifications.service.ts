import { api, unwrapData } from './api/api';
import { AppNotification, Paginated } from '@/types';

export const notificationsApi = api.injectEndpoints({
  endpoints: build => ({
    getUnreadCount: build.query<number, void>({
      query: () => ({ path: '/me/notifications/unread-count' }),
      transformResponse: (res: { data: { unread: number } }) => res.data.unread,
      providesTags: ['Notifications'],
    }),
    /** Daftar berhalaman (20 per halaman), terbaru di atas. */
    getNotifications: build.infiniteQuery<Paginated<AppNotification>, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: last =>
          last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined,
      },
      query: ({ pageParam }) => ({
        path: '/me/notifications',
        params: { per_page: 20, page: pageParam },
      }),
      providesTags: ['Notifications'],
    }),
    markNotificationRead: build.mutation<AppNotification, number>({
      query: id => ({ path: `/me/notifications/${id}/read`, method: 'POST' }),
      transformResponse: unwrapData<AppNotification>,
      // langsung tandai dibaca di daftar dan kurangi badge, tanpa menunggu server
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patches = [
          dispatch(
            notificationsApi.util.updateQueryData('getNotifications', undefined, draft => {
              for (const page of draft.pages)
                for (const n of page.data)
                  if (n.id === id && !n.is_read) {
                    n.is_read = true;
                    n.read_at = new Date().toISOString();
                  }
            }),
          ),
          dispatch(
            notificationsApi.util.updateQueryData('getUnreadCount', undefined, draft =>
              Math.max(0, draft - 1),
            ),
          ),
        ];
        try {
          await queryFulfilled;
        } catch {
          patches.forEach(p => p.undo());
        }
      },
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
  useGetNotificationsInfiniteQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
