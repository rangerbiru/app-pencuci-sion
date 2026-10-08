import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { space } from '@/theme';
import { toApiError, useGetWorkHistoryQuery } from '@/services';
import { formatDayLong } from '@/utils/date';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';
import WorkCardSummary from '@/scenes/workCards/WorkCardSummary';
import SubmissionRow from './SubmissionRow';

/** Detail satu hari: kartu kerja dan pengajuan dengan foto. */
function HistoryDay({ date }: { date: string }) {
  const q = useGetWorkHistoryQuery({ from: date, to: date });
  const day = q.data?.find(d => d.date === date);
  return (
    <Screen
      title={formatDayLong(date)}
      back
      refreshing={q.isFetching && !q.isLoading}
      onRefresh={q.refetch}>
      {q.isLoading ? (
        <SkeletonList rows={3} />
      ) : q.error ? (
        <ErrorState error={toApiError(q.error)} onRetry={q.refetch} />
      ) : !day ? (
        <EmptyState
          icon="calendar"
          title="Tidak ada data di hari ini"
          actionLabel="Kembali ke Riwayat"
          onAction={() => router.back()}
        />
      ) : (
        <>
          {day.card ? <WorkCardSummary card={day.card} /> : null}
          <Section title="Pengajuan" description="Ketuk foto untuk memperbesar.">
            {day.submissions.length === 0 ? (
              <Card>
                <EmptyState icon="inbox" title="Tidak ada pengajuan" />
              </Card>
            ) : (
              <Card style={styles.tight}>
                {day.submissions.map((s, i) => (
                  <SubmissionRow key={s.id} s={s} divider={i < day.submissions.length - 1} />
                ))}
              </Card>
            )}
          </Section>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tight: { paddingVertical: space.xs },
});

export default HistoryDay;
