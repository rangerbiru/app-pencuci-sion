import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { sizes, space } from '@/theme';
import { isFeatureEnabled } from '@/utils/config';
import { formatDateTime } from '@/utils/date';
import { compareDecimal } from '@/utils/decimal';
import { formatGram } from '@/utils/format';
import { toApiError, useGetIncomingBatchesQuery, useGetRationBatchesQuery } from '@/services';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Button from '@/components/elements/Button';
import Amount from '@/components/elements/Amount';
import Segmented from '@/components/elements/Segmented';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';

type Tab = 'masuk' | 'jatah';

/** Batch: batch masuk (terima) dan penjatahan dari batch yang sudah diterima. */
function Batches({ back }: { back?: boolean }) {
  const showRations = isFeatureEnabled('rations');
  const [tab, setTab] = useState<Tab>('masuk');
  const incoming = useGetIncomingBatchesQuery(undefined, { skip: tab !== 'masuk' });
  const rations = useGetRationBatchesQuery(undefined, { skip: tab !== 'jatah' });
  const q = tab === 'masuk' ? incoming : rations;

  return (
    <Screen
      title="Batch"
      back={back}
      refreshing={q.isFetching && !q.isLoading}
      onRefresh={q.refetch}>
      {showRations ? (
        <Segmented
          accessibilityLabel="Jenis daftar batch"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'masuk', label: 'Batch masuk' },
            { value: 'jatah', label: 'Penjatahan' },
          ]}
        />
      ) : null}

      {q.isLoading ? (
        <SkeletonList rows={3} />
      ) : q.error ? (
        <ErrorState error={toApiError(q.error)} onRetry={q.refetch} />
      ) : tab === 'masuk' ? (
        incoming.data && incoming.data.length > 0 ? (
          <View style={styles.list}>
            {incoming.data.map(b => (
              <Card key={b.id} style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text variant="subheading">{b.batch_code}</Text>
                    <Text variant="small" color="textSecondary">
                      {b.item}
                      {b.grades.length ? `, grade ${b.grades.join(' dan ')}` : ''}
                    </Text>
                  </View>
                  <Badge status={b.status} kind="batch" />
                </View>
                <View>
                  <Text variant="small" color="textSecondary">
                    Dikirim
                  </Text>
                  <Amount value={b.sent_gram} unit="gram" size="l" />
                </View>
                <Button
                  title="Terima batch"
                  variant="secondary"
                  icon="download"
                  onPress={() =>
                    router.push({ pathname: '/batch/terima/[id]', params: { id: String(b.id) } })
                  }
                />
              </Card>
            ))}
          </View>
        ) : (
          <Card>
            <EmptyState
              icon="package"
              title="Tidak ada batch yang menunggu diterima"
              message="Batch yang diserahkan gudang akan muncul di sini."
              actionLabel="Muat ulang"
              onAction={incoming.refetch}
            />
          </Card>
        )
      ) : rations.data && rations.data.length > 0 ? (
        <View style={styles.list}>
          {rations.data.map(b => {
            const canRation =
              b.remaining_gram !== null && compareDecimal(b.remaining_gram, '0') > 0;
            return (
              <Card key={b.id} style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text variant="subheading">{b.batch_code}</Text>
                    <Text variant="small" color="textSecondary">
                      {b.item}, diterima {formatDateTime(b.received_at)}
                    </Text>
                  </View>
                  <Badge status={b.status} kind="batch" />
                </View>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text variant="small" color="textSecondary">
                      Sisa belum dijatah
                    </Text>
                    <Amount value={b.remaining_gram} unit="gram" size="m" />
                  </View>
                  <View style={styles.flex}>
                    <Text variant="small" color="textSecondary">
                      Diterima
                    </Text>
                    <Text variant="bodyStrong">{formatGram(b.received_gram)}</Text>
                  </View>
                </View>
                {b.assignments.length > 0 ? (
                  <View style={styles.assignments}>
                    {b.assignments.map(a => (
                      <View key={a.id} style={styles.row}>
                        <Text variant="body" style={styles.flex}>
                          {a.worker.name}
                        </Text>
                        <Text variant="bodyStrong" style={styles.tabular}>
                          {formatGram(a.target_gram)}
                        </Text>
                        <Badge status={a.status} kind="assignment" />
                      </View>
                    ))}
                  </View>
                ) : null}
                {b.can_prepare && isFeatureEnabled('preparation') ? (
                  <Button
                    title="Penyiapan"
                    variant="secondary"
                    icon="layers"
                    onPress={() =>
                      router.push({ pathname: '/batch/siapkan/[id]', params: { id: String(b.id) } })
                    }
                  />
                ) : null}
                {canRation ? (
                  <Button
                    title="Buat penjatahan"
                    variant="secondary"
                    icon="users"
                    onPress={() =>
                      router.push({ pathname: '/batch/jatah/[id]', params: { id: String(b.id) } })
                    }
                  />
                ) : (
                  <Text variant="small" color="textSecondary">
                    Seluruh gram sudah dijatahkan.
                  </Text>
                )}
              </Card>
            );
          })}
        </View>
      ) : (
        <Card>
          <EmptyState
            icon="users"
            title="Belum ada batch untuk dijatah"
            message="Terima batch masuk dulu; penjatahan hanya dari batch yang sudah diterima."
            actionLabel="Lihat batch masuk"
            onAction={() => setTab('masuk')}
          />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: space.md },
  card: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  assignments: { gap: space.sm, paddingTop: space.xs },
  tabular: { fontVariant: ['tabular-nums'], minWidth: sizes.touch * 2, textAlign: 'right' },
});

export default Batches;
