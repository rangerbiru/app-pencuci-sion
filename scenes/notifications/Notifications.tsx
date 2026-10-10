import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import { sizes, space } from '@/theme';
import { AppNotification } from '@/types';
import { useAppSlice } from '@/slices';
import { formatTime } from '@/utils/date';
import {
  toApiError,
  useGetNotificationsInfiniteQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  staleError,
} from '@/services';
import { useToast } from '@/components/elements/Toast';
import Screen from '@/components/layouts/Screen';
import Card, { CardSegment } from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import Button from '@/components/elements/Button';
import Icon from '@/components/elements/Icon';
import { SkeletonRows } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';
import { PressableScale } from '@/components/elements/Motion';
import type { ListRenderItem } from '@shopify/flash-list';
import { notificationHref } from './notificationTarget';
import {
  flattenGroups,
  groupByDay,
  NotificationListItem,
  notificationKind,
} from './notificationView';

const Row = memo(function Row({
  n,
  onOpen,
}: {
  n: AppNotification;
  onOpen: (n: AppNotification) => void;
}) {
  const { colors, badges } = useTheme();
  const kind = notificationKind(n);
  const tone = badges[kind.tone];
  return (
    <PressableScale
      onPress={() => onOpen(n)}
      haptic={false}
      accessibilityLabel={`${n.is_read ? '' : 'Belum dibaca. '}${n.title}. ${n.body}. Jam ${formatTime(n.created_at)}`}
      accessibilityHint={n.target ? 'Membuka halaman terkait' : undefined}
      style={[styles.row, !n.is_read && { backgroundColor: colors.infoBg }]}>
      <View style={[styles.icon, { backgroundColor: tone.bg }]}>
        <Icon name={kind.icon} size={18} color={tone.text} />
      </View>
      <View style={styles.flex}>
        <View style={styles.titleRow}>
          <Text type={n.is_read ? 'body' : 'bodyStrong'} style={styles.flex}>
            {n.title}
          </Text>
          <Text type="caption" color="textSecondary">
            {formatTime(n.created_at)}
          </Text>
        </View>
        <Text type="small" color="textSecondary">
          {n.body}
        </Text>
      </View>
      {!n.is_read ? (
        <View
          style={[styles.unread, { backgroundColor: colors.accent }]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : null}
    </PressableScale>
  );
});

/**
 * Notifikasi (Tahap 15D): terbaru di atas dikelompokkan per hari, belum dibaca ditandai (latar,
 * huruf tebal, titik emas). Ketuk = tandai dibaca (langsung, optimistis) lalu buka `target`.
 * Tandai semua dibaca, muat lebih banyak, tarik untuk menyegarkan.
 */
function Notifications() {
  const toast = useToast();
  const { user } = useAppSlice();
  // selalu ambil ulang saat layar dibuka: lonceng bisa sudah menghitung notifikasi baru
  const q = useGetNotificationsInfiniteQuery(undefined, { refetchOnMountOrArgChange: true });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, markAllState] = useMarkAllNotificationsReadMutation();
  const items = useMemo(() => q.data?.pages.flatMap(p => p.data) ?? [], [q.data]);
  const unread = items.filter(n => !n.is_read).length;
  const rows = useMemo(() => flattenGroups(groupByDay(items)), [items]);
  const role = user?.role.code;

  const open = useCallback(
    (n: AppNotification) => {
      if (!n.is_read) markRead(n.id).catch(() => undefined);
      const href = notificationHref(n, role);
      if (href) router.push(href);
    },
    [markRead, role],
  );

  const renderItem: ListRenderItem<NotificationListItem> = useCallback(
    ({ item, index }) =>
      item.type === 'day' ? (
        <Text
          type="label"
          color="textSecondary"
          accessibilityRole="header"
          style={[styles.day, index === 0 && styles.firstDay]}>
          {item.label}
        </Text>
      ) : (
        <CardSegment first={item.first} last={item.last}>
          <Row n={item.n} onOpen={open} />
        </CardSegment>
      ),
    [open],
  );
  const loadMore = () => {
    if (q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage();
  };

  return (
    <Screen
      title="Notifikasi"
      subtitle={unread > 0 ? `${unread} belum dibaca` : 'Semua sudah dibaca'}
      back
      refreshing={q.isFetching && !q.isLoading && !q.isFetchingNextPage}
      refreshError={staleError(q)}
      onRefresh={q.refetch}
      list={{
        data: rows,
        renderItem,
        keyExtractor,
        getItemType,
        onEndReached: loadMore,
        footer:
          items.length === 0 ? null : q.hasNextPage ? (
            <Button
              title="Muat lebih banyak"
              variant="secondary"
              onPress={loadMore}
              isLoading={q.isFetchingNextPage}
            />
          ) : (
            <Text type="small" color="textSecondary" align="center">
              Notifikasi lebih dari 60 hari dihapus otomatis.
            </Text>
          ),
      }}>
      {unread > 0 ? (
        <Button
          title="Tandai semua dibaca"
          variant="secondary"
          icon="check-circle"
          isLoading={markAllState.isLoading}
          onPress={async () => {
            try {
              await markAll().unwrap();
              toast.show('Semua notifikasi ditandai dibaca');
            } catch (e) {
              toast.show(toApiError(e).message, 'error');
            }
          }}
        />
      ) : null}

      {q.isLoading ? (
        <SkeletonRows rows={5} leading />
      ) : items.length > 0 ? null : q.error ? (
        <ErrorState error={toApiError(q.error)} onRetry={q.refetch} />
      ) : (
        <Card>
          <EmptyState
            icon="bell"
            title="Belum ada notifikasi"
            message="Kabar pengajuan, hasil timbang, upah, dan penarikan akan muncul di sini."
          />
        </Card>
      )}
    </Screen>
  );
}

const keyExtractor = (item: NotificationListItem) => item.key;
const getItemType = (item: NotificationListItem) => item.type;

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  day: { paddingTop: space.lg, paddingBottom: space.sm },
  firstDay: { paddingTop: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: sizes.gutter,
  },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  unread: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
});

export default Notifications;
