import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { space } from '@/theme';
import { WorkCard } from '@/types';
import { toApiError, useGetAllWorkCardsInfiniteQuery, useGetWorkCardsQuery } from '@/services';
import { formatDayLong, formatDayShort, jakarta } from '@/utils/date';
import { formatGram } from '@/utils/format';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Button, { IconButton } from '@/components/elements/Button';
import ListRow from '@/components/elements/ListRow';
import Segmented from '@/components/elements/Segmented';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';

type Mode = 'tanggal' | 'semua';

function CardRows({ cards, showDate }: { cards: WorkCard[]; showDate: boolean }) {
  return (
    <Card padded={false}>
      {cards.map((c, i) => (
        <ListRow
          key={c.id}
          title={showDate ? `${c.worker.name}, ${formatDayShort(c.work_date)}` : c.worker.name}
          subtitle={`Bahan ${formatGram(c.material.gram)}, hasil ${formatGram(c.result.gram)}`}
          divider={i < cards.length - 1}
          onPress={() => router.push({ pathname: '/kartu/[id]', params: { id: String(c.id) } })}
          below={
            <View style={styles.badges}>
              <Badge status={c.status} kind="daily_work" />
              {c.qc_status ? (
                <Badge status={c.qc_status} kind="qc" prefix="QC" />
              ) : (
                <Badge label="Belum QC" tone="gold" />
              )}
              {c.weighing_confirmation ? (
                <Badge
                  status={c.weighing_confirmation.status}
                  kind="weighing_confirmation"
                  icon="clipboard"
                />
              ) : null}
            </View>
          }
        />
      ))}
    </Card>
  );
}

/** Kartu Kerja: per tanggal, atau semua kartu (terbaru dulu, per halaman). */
function WorkCards({ back }: { back?: boolean }) {
  const today = jakarta().format('YYYY-MM-DD');
  const [mode, setMode] = useState<Mode>('tanggal');
  const [date, setDate] = useState(today);
  const byDate = useGetWorkCardsQuery({ date }, { skip: mode !== 'tanggal' });
  const all = useGetAllWorkCardsInfiniteQuery(undefined, { skip: mode !== 'semua' });
  const dayCards = byDate.data?.data ?? [];
  const allCards = all.data?.pages.flatMap(p => p.data) ?? [];
  const total = all.data?.pages[0]?.meta.total ?? 0;
  const shift = (n: number) =>
    setDate(d => jakarta(`${d}T12:00:00+07:00`).add(n, 'day').format('YYYY-MM-DD'));
  const notQc = dayCards.filter(c => !c.qc_status).length;
  const q = mode === 'tanggal' ? byDate : all;

  return (
    <Screen
      title="Kartu Kerja"
      back={back}
      refreshing={q.isFetching && !q.isLoading && !all.isFetchingNextPage}
      onRefresh={q.refetch}>
      <Segmented<Mode>
        accessibilityLabel="Tampilan kartu"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'tanggal', label: 'Per tanggal' },
          { value: 'semua', label: 'Semua' },
        ]}
      />

      {mode === 'tanggal' ? (
        <>
          <View style={styles.datePicker}>
            <IconButton
              icon="chevron-left"
              accessibilityLabel="Hari sebelumnya"
              onPress={() => shift(-1)}
            />
            <View style={styles.flex}>
              <Text variant="bodyStrong" align="center">
                {formatDayLong(date)}
              </Text>
              <Text variant="small" color="textSecondary" align="center">
                {byDate.data ? `${dayCards.length} kartu, ${notQc} belum QC` : ' '}
              </Text>
            </View>
            <IconButton
              icon="chevron-right"
              accessibilityLabel="Hari berikutnya"
              disabled={date >= today}
              onPress={() => shift(1)}
            />
          </View>
          {byDate.isLoading ? (
            <SkeletonList rows={4} />
          ) : byDate.error ? (
            <ErrorState error={toApiError(byDate.error)} onRetry={byDate.refetch} />
          ) : dayCards.length === 0 ? (
            <Card>
              <EmptyState
                icon="clipboard"
                title="Belum ada kartu di tanggal ini"
                message="Kartu dibuat otomatis saat pengambilan bahan disetujui."
                actionLabel={date === today ? 'Lihat kemarin' : 'Kembali ke hari ini'}
                onAction={() => (date === today ? shift(-1) : setDate(today))}
              />
            </Card>
          ) : (
            <CardRows cards={dayCards} showDate={false} />
          )}
        </>
      ) : all.isLoading ? (
        <SkeletonList rows={5} />
      ) : all.error && allCards.length === 0 ? (
        <ErrorState error={toApiError(all.error)} onRetry={all.refetch} />
      ) : allCards.length === 0 ? (
        <Card>
          <EmptyState icon="clipboard" title="Belum ada kartu kerja" />
        </Card>
      ) : (
        <>
          <Text variant="small" color="textSecondary">
            {allCards.length} dari {total} kartu, terbaru di atas.
          </Text>
          <CardRows cards={allCards} showDate />
          {all.hasNextPage ? (
            <Button
              title="Muat lebih banyak"
              variant="secondary"
              onPress={() => all.fetchNextPage()}
              isLoading={all.isFetchingNextPage}
            />
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  datePicker: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xs },
});

export default WorkCards;
