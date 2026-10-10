import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import { sizes, space } from '@/theme';
import { AppNotification } from '@/types';
import { useAppSlice } from '@/slices';
import { formatDateTime } from '@/utils/date';
import {
  toApiError,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/services';
import { useToast } from '@/components/elements/Toast';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import Button from '@/components/elements/Button';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';
import { FadeInItem, PressableScale } from '@/components/elements/Motion';
import { notificationHref } from './notificationTarget';

/** Notifikasi: terbaru di atas, belum dibaca ditandai; ketuk = tandai dibaca lalu buka tujuannya. */
function Notifications() {
  const { colors } = useTheme();
  const toast = useToast();
  const { user } = useAppSlice();
  const q = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, markAllState] = useMarkAllNotificationsReadMutation();
  const items = q.data?.data ?? [];
  const unread = items.filter(n => !n.is_read).length;

  async function open(n: AppNotification) {
    if (!n.is_read) markRead(n.id).catch(() => undefined);
    const href = notificationHref(n, user?.role.code);
    if (href) router.push(href);
  }

  return (
    <Screen
      title="Notifikasi"
      subtitle={unread > 0 ? `${unread} belum dibaca` : undefined}
      back
      refreshing={q.isFetching && !q.isLoading}
      onRefresh={q.refetch}>
      {unread > 0 ? (
        <Button
          title="Tandai semua dibaca"
          variant="secondary"
          icon="check-circle"
          isLoading={markAllState.isLoading}
          onPress={async () => {
            try {
              await markAll().unwrap();
            } catch (e) {
              toast.show(toApiError(e).message, 'error');
            }
          }}
          style={styles.markAll}
        />
      ) : null}
      {q.isLoading ? (
        <SkeletonList rows={5} />
      ) : q.error && items.length === 0 ? (
        <ErrorState error={toApiError(q.error)} onRetry={q.refetch} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="bell"
            title="Belum ada notifikasi"
            message="Kabar pengajuan, timbang, upah, dan penarikan akan muncul di sini."
          />
        </Card>
      ) : (
        <Card padded={false}>
          {items.map((n, i) => (
            <FadeInItem key={n.id} index={i}>
              <PressableScale
                onPress={() => open(n)}
                haptic={false}
                accessibilityLabel={`${n.is_read ? '' : 'Belum dibaca. '}${n.title}. ${n.body}`}
                style={[
                  styles.row,
                  !n.is_read && { backgroundColor: colors.infoBg },
                  i < items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}>
                <View
                  style={[
                    styles.mark,
                    { backgroundColor: n.is_read ? 'transparent' : colors.accent },
                  ]}
                />
                <View style={styles.flex}>
                  <Text type={n.is_read ? 'body' : 'bodyStrong'}>{n.title}</Text>
                  <Text type="small" color="textSecondary">
                    {n.body}
                  </Text>
                  <Text type="caption" color="textSecondary">
                    {formatDateTime(n.created_at)}
                  </Text>
                </View>
              </PressableScale>
            </FadeInItem>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  markAll: { alignSelf: 'flex-start' },
  row: {
    flexDirection: 'row',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: sizes.gutter,
  },
  mark: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
});

export default Notifications;
