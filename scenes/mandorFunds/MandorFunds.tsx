import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import { space } from '@/theme';
import { toApiError, useGetMandorFundsQuery, staleError } from '@/services';
import { compareDecimal } from '@/utils/decimal';
import { formatRupiah } from '@/utils/format';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Amount from '@/components/elements/Amount';
import Button from '@/components/elements/Button';
import MoneyRow from '@/scenes/earnings/MoneyRow';
import { SkeletonRows } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';

/** Dana Mandor: saldo pencuci Borongan yang dibayar dari dana Mandor ini (GET /mandor/funds). */
function MandorFunds() {
  const { colors } = useTheme();
  const q = useGetMandorFundsQuery();
  const d = q.data;

  return (
    <Screen
      title="Dana Mandor"
      back
      refreshing={q.isFetching && !q.isLoading}
      refreshError={staleError(q)}
      onRefresh={q.refetch}>
      {q.isLoading ? (
        <SkeletonRows rows={4} />
      ) : q.error && !q.data ? (
        <ErrorState error={toApiError(q.error)} onRetry={q.refetch} />
      ) : d ? (
        <>
          <Card style={styles.gap}>
            <Text variant="small" color="textSecondary">
              Saldo pencuci yang harus dibayar dari dana Anda
            </Text>
            <Amount value={d.total.dapat_dicairkan} unit="rupiah" whole size="xl" />
            <Text variant="small" color="textSecondary">
              {d.total.workers} pencuci Borongan. THR ditahan{' '}
              {formatRupiah(d.total.thr_ditahan, { style: 'whole' })}.
            </Text>
            {compareDecimal(d.total.withdrawal_active, '0') > 0 ? (
              <Button
                title={`Pengajuan aktif ${formatRupiah(d.total.withdrawal_active, { style: 'whole' })}`}
                variant="secondary"
                icon="inbox"
                onPress={() => router.push('/penarikan-tim')}
              />
            ) : null}
          </Card>

          <Section title="Per pencuci" description="Sama dengan saldo yang dilihat pencuci.">
            {d.workers.length === 0 ? (
              <Card>
                <EmptyState icon="users" title="Belum ada pencuci Borongan" />
              </Card>
            ) : (
              <Card style={styles.tight}>
                {d.workers.map((w, i) => (
                  <View
                    key={w.worker.id}
                    style={
                      i < d.workers.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }
                    }>
                    <View style={styles.name}>
                      <Text variant="bodyStrong" style={styles.flex}>
                        {w.worker.name}
                      </Text>
                      {!w.in_team ? <Badge label="Sudah pindah tim" tone="neutral" /> : null}
                    </View>
                    <MoneyRow label="Dapat dicairkan" amount={w.dapat_dicairkan} />
                    <MoneyRow
                      label="THR ditahan"
                      amount={w.thr_ditahan}
                      divider={compareDecimal(w.withdrawal_active, '0') > 0}
                    />
                    {compareDecimal(w.withdrawal_active, '0') > 0 ? (
                      <MoneyRow
                        label="Pengajuan aktif"
                        amount={w.withdrawal_active}
                        note="Diajukan atau disetujui, belum dibayar"
                        divider={false}
                      />
                    ) : null}
                  </View>
                ))}
              </Card>
            )}
          </Section>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.sm },
  tight: { paddingVertical: space.xs },
  name: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingTop: space.md },
});

export default MandorFunds;
