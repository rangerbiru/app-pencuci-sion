import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { sizes } from '@/theme';
import { toApiError, useGetTeamWithdrawalsQuery } from '@/services';
import { formatDateTime } from '@/utils/date';
import { formatRupiah } from '@/utils/format';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Badge from '@/components/elements/Badge';
import ListRow from '@/components/elements/ListRow';
import Segmented from '@/components/elements/Segmented';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';

type Filter = 'diajukan' | 'disetujui' | 'semua';

/** Penarikan pencuci Borongan dari dana Mandor. */
function TeamWithdrawals() {
  const [filter, setFilter] = useState<Filter>('diajukan');
  const q = useGetTeamWithdrawalsQuery(filter === 'semua' ? {} : { status: filter });
  const items = q.data?.data ?? [];
  return (
    <Screen
      title="Penarikan Borongan"
      subtitle="Dari dana Mandor"
      back
      refreshing={q.isFetching && !q.isLoading}
      onRefresh={q.refetch}>
      <Segmented
        accessibilityLabel="Status penarikan"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'diajukan', label: 'Diajukan' },
          { value: 'disetujui', label: 'Disetujui' },
          { value: 'semua', label: 'Semua' },
        ]}
      />
      {q.isLoading ? (
        <SkeletonList rows={3} />
      ) : q.error ? (
        <ErrorState error={toApiError(q.error)} onRetry={q.refetch} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="dollar-sign"
            title={filter === 'semua' ? 'Belum ada penarikan' : `Tidak ada penarikan ${filter}`}
            actionLabel={filter === 'semua' ? 'Muat ulang' : 'Lihat semua'}
            onAction={() => (filter === 'semua' ? q.refetch() : setFilter('semua'))}
          />
        </Card>
      ) : (
        <Card padded={false} style={styles.list}>
          {items.map((w, i) => (
            <ListRow
              key={w.id}
              title={`${w.worker?.name ?? 'Pencuci'}: ${formatRupiah(w.amount, { style: 'whole' })}`}
              subtitle={`Diajukan ${formatDateTime(w.requested_at)}`}
              right={<Badge status={w.status} kind="withdrawal" />}
              divider={i < items.length - 1}
              onPress={() =>
                router.push({
                  pathname: '/penarikan-tim/[id]',
                  params: { id: String(w.id), status: filter },
                })
              }
            />
          ))}
        </Card>
      )}
      <View />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: sizes.gutter },
});

export default TeamWithdrawals;
