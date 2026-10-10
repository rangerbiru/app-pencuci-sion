import { memo, useCallback } from 'react';
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
} from '@/services';
import { useToast } from '@/components/elements/Toast';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import Button from '@/components/elements/Button';
import Icon from '@/components/elements/Icon';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';
import { FadeInItem, PressableScale } from '@/components/elements/Motion';
import { notificationHref } from './notificationTarget';
import { groupByDay, notificationKind } from './notificationView';

const Row = memo(function Row({
  n,
  last,
  onOpen,
}: {
  n: AppNotification;
  last: boolean;
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
      style={[
        styles.row,
        !n.is_read && { backgroundColor: colors.infoBg },
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}>
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
  const items = q.data?.pages.flatMap(p => p.data) ?? [];
  const unread = items.filter(n => !n.is_read).length;
  const groups = groupByDay(items);
  const role = user?.role.code;

  const open = useCallback(
    (n: AppNotification) => {
      if (!n.is_read) markRead(n.id).catch(() => undefined);
      const href = notificationHref(n, role);
      if (href) router.push(href);
    },
    [markRead, role],
  );

  let index = 0;
  return (
    <Screen
      title="Notifikasi"
      subtitle={unread > 0 ? `${unread} belum dibaca` : 'Semua sudah dibaca'}
      back
      refreshing={q.isFetching && !q.isLoading && !q.isFetchingNextPage}
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
              toast.show('Semua notifikasi ditandai dibaca');
            } catch (e) {
              toast.show(toApiError(e).message, 'error');
            }
          }}
        />
      ) : null}

      {q.isLoading ? (
        <SkeletonList rows={5} />
      ) : items.length === 0 ? (
        q.error ? (
          <ErrorState error={toApiError(q.error)} onRetry={q.refetch} />
        ) : (
          <Card>
            <EmptyState
              icon="bell"
              title="Belum ada notifikasi"
              message="Kabar pengajuan, hasil timbang, upah, dan penarikan akan muncul di sini."
            />
          </Card>
        )
      ) : (
        <>
          {q.error ? (
            // gagal menyegarkan: isi lama tetap tampil
            <ErrorState error={toApiError(q.error)} onRetry={q.refetch} />
          ) : null}
          {groups.map(g => (
            <View key={g.label} style={styles.group}>
              <Text type="label" color="textSecondary" accessibilityRole="header">
                {g.label}
              </Text>
              <Card padded={false}>
                {g.items.map((n, i) => (
                  <FadeInItem key={n.id} index={index++}>
                    <Row n={n} last={i === g.items.length - 1} onOpen={open} />
                  </FadeInItem>
                ))}
              </Card>
            </View>
          ))}
          {q.hasNextPage ? (
            <Button
              title="Muat lebih banyak"
              variant="secondary"
              onPress={() => q.fetchNextPage()}
              isLoading={q.isFetchingNextPage}
            />
          ) : (
            <Text type="small" color="textSecondary" align="center">
              Notifikasi lebih dari 60 hari dihapus otomatis.
            </Text>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  group: { gap: space.sm },
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
