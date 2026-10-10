import { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { space } from '@/theme';
import { WorkCard } from '@/types';
import {
  toApiError,
  useGetAllWorkCardsInfiniteQuery,
  useGetWorkCardsQuery,
  staleError,
  forCurrentArg,
} from '@/services';
import { formatDayLong, formatDayShort, jakarta } from '@/utils/date';
import { formatGram } from '@/utils/format';
import Screen from '@/components/layouts/Screen';
import Card, { CardSegment } from '@/components/elements/Card';
import type { ListRenderItem } from '@shopify/flash-list';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Button, { IconButton } from '@/components/elements/Button';
import ListRow from '@/components/elements/ListRow';
import Segmented from '@/components/elements/Segmented';
import { SkeletonRows } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';

type Mode = 'tanggal' | 'semua';

function openCard(c: WorkCard) {
  router.push({ pathname: '/kartu/[id]', params: { id: String(c.id) } });
}

const WorkCardRow = memo(function WorkCardRow({
  c,
  showDate,
  divider,
}: {
  c: WorkCard;
  showDate: boolean;
  divider: boolean;
}) {
  return (
    <ListRow
      title={showDate ? `${c.worker.name}, ${formatDayShort(c.work_date)}` : c.worker.name}
      subtitle={`Bahan ${formatGram(c.material.gram)}, hasil ${formatGram(c.result.gram)}`}
      divider={divider}
      onPress={() => openCard(c)}
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
              prefix="Timbang"
            />
          ) : null}
        </View>
      }
    />
  );
});

function CardRows({ cards }: { cards: WorkCard[] }) {
  return (
    <Card padded={false}>
      {cards.map((c, i) => (
        <WorkCardRow key={c.id} c={c} showDate={false} divider={i < cards.length - 1} />
      ))}
    </Card>
  );
}

const keyExtractor = (c: WorkCard) => String(c.id);

/** Kartu Kerja: per tanggal, atau semua kartu (terbaru dulu, per halaman). */
function WorkCards({ back }: { back?: boolean }) {
  const today = jakarta().format('YYYY-MM-DD');
  const [mode, setMode] = useState<Mode>('tanggal');
  const [date, setDate] = useState(today);
  const byDate = forCurrentArg(useGetWorkCardsQuery({ date }, { skip: mode !== 'tanggal' }));
  const all = useGetAllWorkCardsInfiniteQuery(undefined, { skip: mode !== 'semua' });
  const dayCards = byDate.data?.data ?? [];
  const allCards = useMemo(() => all.data?.pages.flatMap(p => p.data) ?? [], [all.data]);
  const total = all.data?.pages[0]?.meta.total ?? 0;
  const shift = (n: number) =>
    setDate(d => jakarta(`${d}T12:00:00+07:00`).add(n, 'day').format('YYYY-MM-DD'));
  const notQc = dayCards.filter(c => !c.qc_status).length;
  const q = mode === 'tanggal' ? byDate : all;
  const lastIndex = allCards.length - 1;
  const renderAll: ListRenderItem<WorkCard> = useCallback(
    ({ item, index }) => (
      <CardSegment first={index === 0} last={index === lastIndex}>
        <WorkCardRow c={item} showDate divider={false} />
      </CardSegment>
    ),
    [lastIndex],
  );
  const loadMore = () => {
    if (all.hasNextPage && !all.isFetchingNextPage) all.fetchNextPage();
  };
  // "Semua" tidak berbatas: FlashList (hanya baris terlihat yang dirender) + muat saat mendekati dasar
  const showAll = mode === 'semua' && allCards.length > 0;

  return (
    <Screen
      title="Kartu Kerja"
      back={back}
      refreshing={q.isFetching && !q.isLoading && !all.isFetchingNextPage}
      refreshError={staleError(q)}
      onRefresh={q.refetch}
      list={
        showAll
          ? {
              data: allCards,
              renderItem: renderAll,
              keyExtractor,
              onEndReached: loadMore,
              footer: all.hasNextPage ? (
                <Button
                  title="Muat lebih banyak"
                  variant="secondary"
                  onPress={loadMore}
                  isLoading={all.isFetchingNextPage}
                />
              ) : null,
            }
          : undefined
      }>
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
            <SkeletonRows rows={4} />
          ) : byDate.error && !byDate.data ? (
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
            <CardRows cards={dayCards} />
          )}
        </>
      ) : all.isLoading ? (
        <SkeletonRows rows={5} />
      ) : all.error && allCards.length === 0 ? (
        <ErrorState error={toApiError(all.error)} onRetry={all.refetch} />
      ) : allCards.length === 0 ? (
        <Card>
          <EmptyState icon="clipboard" title="Belum ada kartu kerja" />
        </Card>
      ) : (
        <Text variant="small" color="textSecondary">
          {allCards.length} dari {total} kartu, terbaru di atas.
        </Text>
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
