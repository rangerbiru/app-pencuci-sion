import { router } from 'expo-router';
import { toApiError, useGetWorkHistoryQuery } from '@/services';
import { formatDayLong } from '@/utils/date';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';
import WorkCardSummary from '@/scenes/workCards/WorkCardSummary';
import SubmissionItem from './SubmissionItem';
import { useSingleOpen } from '@/components/elements/Accordion';

/** Detail satu hari: kartu kerja dan pengajuan dengan foto. */
function HistoryDay({ date }: { date: string }) {
  const q = useGetWorkHistoryQuery({ from: date, to: date });
  const day = q.data?.find(d => d.date === date);
  const open = useSingleOpen(null);
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
          <Section title="Pengajuan" description="Ketuk pengajuan untuk rincian dan foto.">
            {day.submissions.length === 0 ? (
              <Card>
                <EmptyState icon="inbox" title="Tidak ada pengajuan" />
              </Card>
            ) : (
              <Card padded={false}>
                {day.submissions.map((s, i) => (
                  <SubmissionItem
                    key={s.id}
                    s={s}
                    open={open.openKey === String(s.id)}
                    onToggle={() => open.toggle(String(s.id))}
                    divider={i < day.submissions.length - 1}
                  />
                ))}
              </Card>
            )}
          </Section>
        </>
      )}
    </Screen>
  );
}

export default HistoryDay;
