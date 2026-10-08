import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useAppSlice, useQueueItems } from '@/slices';
import useNow from '@/hooks/useNow';
import { space } from '@/theme';
import { isFeatureEnabled } from '@/utils/config';
import { formatDayLong, greeting } from '@/utils/date';
import {
  toApiError,
  useGetAttendanceTodayQuery,
  useGetBalanceQuery,
  useGetMyRationsQuery,
  useGetMyReworkQuery,
  useGetMyWeighingsQuery,
  useGetWorkTodayQuery,
  useGetApprovalsQuery,
} from '@/services';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import Amount from '@/components/elements/Amount';
import Button from '@/components/elements/Button';
import ListRow from '@/components/elements/ListRow';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';
import TodayCard from './TodayCard';
import WeighingCard from './WeighingCard';
import RationList from './RationList';
import { buildToday } from './todaySteps';

/** Beranda Pencuci (juga Kepala Pencuci, ditambah pintasan tim). */
function WorkerHome() {
  const { user } = useAppSlice();
  const queue = useQueueItems();
  const now = useNow(60000);
  const isPencuci = user?.role.code === 'pencuci';
  const isKepala = user?.role.code === 'kepala_pencuci';

  const attendance = useGetAttendanceTodayQuery(undefined, {
    skip: !isFeatureEnabled('attendance'),
  });
  const work = useGetWorkTodayQuery(undefined, { skip: !isFeatureEnabled('work') });
  const rework = useGetMyReworkQuery(undefined, {
    skip: !isFeatureEnabled('rework') || !isPencuci,
  });
  const weighings = useGetMyWeighingsQuery(undefined, {
    skip: !isFeatureEnabled('weighing') || !isPencuci,
  });
  const rations = useGetMyRationsQuery(undefined, { skip: !isFeatureEnabled('work') });
  const balance = useGetBalanceQuery(undefined, { skip: !isFeatureEnabled('earnings') });
  const approvals = useGetApprovalsQuery(undefined, {
    skip: !isKepala || !isFeatureEnabled('approvals'),
  });

  const refreshing =
    attendance.isFetching ||
    work.isFetching ||
    rework.isFetching ||
    weighings.isFetching ||
    rations.isFetching;
  const refresh = () => {
    attendance.refetch();
    work.refetch();
    if (isPencuci) {
      rework.refetch();
      weighings.refetch();
    }
    rations.refetch();
    balance.refetch();
    if (isKepala) approvals.refetch();
  };

  const mine = queue.filter(q => q.owner === (user?.id ?? null));
  const loadingToday = attendance.isLoading || work.isLoading;
  const todayError = attendance.error ?? work.error;
  const model = buildToday({
    attendance: attendance.data,
    work: work.data,
    queue: mine,
    rework: rework.data ?? [],
  });

  const pendingWeighings = (weighings.data ?? []).filter(
    c => c.weighing_confirmation?.status.code === 'menunggu',
  );
  const mandorFunds = balance.data?.mandor_funds ?? [];
  const paidByMandor = balance.data?.paid_by.code === 'mandor';

  return (
    <Screen
      title={`${greeting(now)}, ${user?.name ?? ''}`}
      subtitle={formatDayLong(now.format('YYYY-MM-DD'))}
      refreshing={refreshing && !loadingToday}
      onRefresh={refresh}>
      {loadingToday ? (
        <SkeletonList rows={3} />
      ) : todayError && !attendance.data && !work.data ? (
        <ErrorState error={toApiError(todayError)} onRetry={refresh} />
      ) : (
        <TodayCard model={model} onRefresh={refresh} />
      )}

      {pendingWeighings.map(card => (
        <WeighingCard key={card.id} card={card} onAnswered={() => weighings.refetch()} />
      ))}

      {isKepala && isFeatureEnabled('team') ? (
        <Card padded={false}>
          <ListRow
            title="Tim saya"
            subtitle="Absen, jatah, dan setoran anggota hari ini"
            onPress={() => router.push('/tim')}
          />
          {isFeatureEnabled('approvals') ? (
            <ListRow
              title="Verifikasi"
              subtitle={
                approvals.data
                  ? approvals.data.meta.total > 0
                    ? `${approvals.data.meta.total} pengajuan menunggu`
                    : 'Tidak ada yang menunggu'
                  : 'Pengajuan anggota tim'
              }
              onPress={() => router.push('/tim-verifikasi')}
              divider={false}
            />
          ) : null}
        </Card>
      ) : null}

      {isFeatureEnabled('work') ? (
        <Section title="Jatah aktif" description="Sisa gram yang masih bisa diambil.">
          {rations.isLoading ? (
            <SkeletonList rows={1} />
          ) : rations.error ? (
            <ErrorState error={toApiError(rations.error)} onRetry={rations.refetch} />
          ) : rations.data && rations.data.length > 0 ? (
            <Card style={styles.tight}>
              <RationList rations={rations.data} />
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon="package"
                title="Belum ada jatah aktif"
                message="Minta Mandor membuat penjatahan untuk Anda, lalu muat ulang."
                actionLabel="Muat ulang"
                onAction={rations.refetch}
              />
            </Card>
          )}
        </Section>
      ) : null}

      {isFeatureEnabled('earnings') && balance.data ? (
        <Section title="Saldo">
          <Card style={styles.balance}>
            {paidByMandor ? (
              mandorFunds.length > 0 ? (
                mandorFunds.map((f, i) => (
                  <View key={i} style={styles.balanceRow}>
                    <View style={styles.flex}>
                      <Text variant="small" color="textSecondary">
                        Dapat dicairkan, dana Mandor{' '}
                        {typeof f.mandor === 'string' ? f.mandor : f.mandor.name}
                      </Text>
                      <Amount value={f.dapat_dicairkan} unit="rupiah" whole size="l" />
                    </View>
                  </View>
                ))
              ) : (
                <Text variant="body" color="textSecondary">
                  {balance.data.paid_by.label}. Upah dibayar langsung oleh Mandor.
                </Text>
              )
            ) : (
              <View style={styles.balanceRow}>
                <View style={styles.flex}>
                  <Text variant="small" color="textSecondary">
                    Saldo Dapat Dicairkan
                  </Text>
                  <Amount value={balance.data.dapat_dicairkan} unit="rupiah" whole size="l" />
                </View>
              </View>
            )}
            {isFeatureEnabled('withdrawals') ? (
              <Button
                title="Tarik dana"
                variant="secondary"
                icon="dollar-sign"
                onPress={() => router.push('/tarik-dana')}
              />
            ) : null}
          </Card>
        </Section>
      ) : null}

      {mine.length > 0 ? (
        <Card padded={false}>
          <ListRow
            title={`Belum terkirim: ${mine.length}`}
            subtitle="Dikirim otomatis saat ada sinyal. Ketuk untuk melihat."
            onPress={() => router.push('/antrean')}
            divider={false}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tight: { paddingVertical: space.xs },
  balance: { gap: space.md },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
});

export default WorkerHome;
