import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { space } from '@/theme';
import { toApiError, useGetWorkCardsQuery } from '@/services';
import { formatDayLong, jakarta } from '@/utils/date';
import { formatGram } from '@/utils/format';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import { IconButton } from '@/components/elements/Button';
import ListRow from '@/components/elements/ListRow';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';

/** Kartu Kerja per tanggal dan pekerja. */
function WorkCards({ back }: { back?: boolean }) {
  const today = jakarta().format('YYYY-MM-DD');
  const [date, setDate] = useState(today);
  const q = useGetWorkCardsQuery({ date });
  const cards = q.data?.data ?? [];
  const shift = (n: number) =>
    setDate(d => jakarta(`${d}T12:00:00+07:00`).add(n, 'day').format('YYYY-MM-DD'));
  const notQc = cards.filter(c => !c.qc_status).length;

  return (
    <Screen
      title="Kartu Kerja"
      back={back}
      refreshing={q.isFetching && !q.isLoading}
      onRefresh={q.refetch}>
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
            {q.data ? `${cards.length} kartu, ${notQc} belum QC` : ' '}
          </Text>
        </View>
        <IconButton
          icon="chevron-right"
          accessibilityLabel="Hari berikutnya"
          disabled={date >= today}
          onPress={() => shift(1)}
        />
      </View>

      {q.isLoading ? (
        <SkeletonList rows={4} />
      ) : q.error ? (
        <ErrorState error={toApiError(q.error)} onRetry={q.refetch} />
      ) : cards.length === 0 ? (
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
        <Card padded={false}>
          {cards.map((c, i) => (
            <ListRow
              key={c.id}
              title={c.worker.name}
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
