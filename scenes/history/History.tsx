import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import { space } from '@/theme';
import { WorkDay } from '@/types';
import { toApiError, useGetWorkHistoryQuery } from '@/services';
import { formatDayShort, formatTime, jakarta } from '@/utils/date';
import { addDecimal } from '@/utils/decimal';
import { formatGram, formatPcs } from '@/utils/format';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Button from '@/components/elements/Button';
import { AccordionItem, useSingleOpen } from '@/components/elements/Accordion';
import Segmented from '@/components/elements/Segmented';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';

type Range = '7' | '30' | '62';

function dayFacts(d: WorkDay) {
  const takes = d.submissions.filter(
    s => s.type.code === 'ambil_bahan' && s.status.code === 'disetujui',
  );
  const hands = d.submissions.filter(
    s => s.type.code === 'serah_lembab' && s.status.code === 'disetujui',
  );
  const material =
    d.card?.material.gram ?? (takes.length ? addDecimal(...takes.map(s => s.gram)) : null);
  const lembab =
    d.card?.pcs_lembab ?? (hands.length ? hands.reduce((n, s) => n + (s.pcs ?? 0), 0) : null);
  return { material, lembab, result: d.card?.result.gram ?? null };
}

/** Riwayat: daftar hari dengan bahan, pcs lembab, hasil, dan status. */
function History() {
  const { colors } = useTheme();
  const [range, setRange] = useState<Range>('7');
  const today = jakarta();
  const args = {
    from: today.subtract(Number(range) - 1, 'day').format('YYYY-MM-DD'),
    to: today.format('YYYY-MM-DD'),
  };
  const history = useGetWorkHistoryQuery(args);
  const todayKey = today.format('YYYY-MM-DD');
  // satu hari terbuka; hari ini terbuka bawaan
  const days = useSingleOpen(todayKey);
  const firstDate = history.data?.[0]?.date;
  const hasToday = !!history.data?.some(d => d.date === todayKey);
  const { setOpenKey } = days;
  // hari ini belum ada catatan: buka hari terakhir yang ada
  useEffect(() => {
    if (firstDate && !hasToday) setOpenKey(k => (k === todayKey ? firstDate : k));
  }, [firstDate, hasToday, todayKey, setOpenKey]);

  return (
    <Screen
      title="Riwayat"
      refreshing={history.isFetching && !history.isLoading}
      onRefresh={history.refetch}>
      <Segmented
        accessibilityLabel="Rentang riwayat"
        value={range}
        onChange={setRange}
        options={[
          { value: '7', label: '7 hari' },
          { value: '30', label: '30 hari' },
          { value: '62', label: '62 hari' },
        ]}
      />
      {history.isLoading ? (
        <SkeletonList rows={5} />
      ) : history.error ? (
        <ErrorState error={toApiError(history.error)} onRetry={history.refetch} />
      ) : !history.data || history.data.length === 0 ? (
        <Card>
          <EmptyState
            icon="calendar"
            title="Belum ada hari kerja"
            message="Hari dengan kartu kerja atau pengajuan akan muncul di sini."
            actionLabel={range === '62' ? 'Muat ulang' : 'Lihat rentang lebih panjang'}
            onAction={() =>
              range === '62' ? history.refetch() : setRange(range === '7' ? '30' : '62')
            }
          />
        </Card>
      ) : (
        <Card padded={false}>
          {history.data.map((d, i) => {
            const f = dayFacts(d);
            const last = i === (history.data?.length ?? 0) - 1;
            return (
              <AccordionItem
                key={d.date}
                open={days.openKey === d.date}
                onToggle={() => days.toggle(d.date)}
                divider={!last}
                accessibilityLabel={`${formatDayShort(d.date)}. Bahan ${formatGram(f.material)}, lembab ${formatPcs(f.lembab)} pcs, hasil ${formatGram(f.result)}`}
                header={
                  <View style={styles.head}>
                    <Text variant="bodyStrong">
                      {formatDayShort(d.date)}
                      {d.date === todayKey ? ' (hari ini)' : ''}
                    </Text>
                    <View style={styles.facts}>
                      <Text variant="small" color="textSecondary">
                        Bahan <Text variant="smallStrong">{formatGram(f.material)}</Text>
                      </Text>
                      <Text variant="small" color="textSecondary">
                        Lembab{' '}
                        <Text variant="smallStrong">
                          {f.lembab == null ? '-' : `${formatPcs(f.lembab)} pcs`}
                        </Text>
                      </Text>
                      <Text variant="small" color="textSecondary">
                        Hasil <Text variant="smallStrong">{formatGram(f.result)}</Text>
                      </Text>
                    </View>
                    <View style={styles.badges}>
                      {d.card ? <Badge status={d.card.status} kind="daily_work" /> : null}
                      {d.card?.qc_status ? (
                        <Badge status={d.card.qc_status} kind="qc" prefix="QC" />
                      ) : null}
                      {d.card?.weighing_confirmation ? (
                        <Badge
                          status={d.card.weighing_confirmation.status}
                          kind="weighing_confirmation"
                          icon="clipboard"
                          prefix="Timbang"
                        />
                      ) : null}
                      {d.card?.wage ? (
                        <Badge
                          status={d.card.wage.status}
                          kind="card_wage"
                          icon="dollar-sign"
                          prefix="Upah"
                        />
                      ) : null}
                      {d.pending_count > 0 ? (
                        <Badge label={`${d.pending_count} menunggu verifikasi`} tone="gold" />
                      ) : null}
                    </View>
                  </View>
                }>
                <View style={styles.body}>
                  {d.submissions.length === 0 ? (
                    <Text variant="small" color="textSecondary">
                      Tidak ada pengajuan di hari ini.
                    </Text>
                  ) : (
                    d.submissions.map(sub => (
                      <View key={sub.id} style={styles.sub}>
                        <View style={styles.flex}>
                          <Text variant="smallStrong">{sub.type.label}</Text>
                          <Text variant="small" color="textSecondary">
                            {[
                              sub.gram ? formatGram(sub.gram) : null,
                              sub.pcs != null ? `${formatPcs(sub.pcs)} pcs` : null,
                            ]
                              .filter(Boolean)
                              .join(', ') || '-'}
                            {`, jam ${formatTime(sub.submitted_at)}`}
                          </Text>
                          {sub.reject_reason ? (
                            <Text variant="small" color="danger">
                              Ditolak: {sub.reject_reason}
                            </Text>
                          ) : null}
                        </View>
                        <Badge status={sub.status} kind="work_submission" />
                      </View>
                    ))
                  )}
                  <Button
                    title="Lihat rincian dan foto"
                    variant="secondary"
                    icon="image"
                    onPress={() =>
                      router.push({ pathname: '/riwayat/[date]', params: { date: d.date } })
                    }
                  />
                </View>
              </AccordionItem>
            );
          })}
        </Card>
      )}
      {history.data && history.data.length > 0 && range !== '62' ? (
        <Button
          title="Lihat rentang lebih panjang"
          variant="ghost"
          onPress={() => setRange(range === '7' ? '30' : '62')}
          style={{ borderColor: colors.border }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flex: 1, gap: space.xs },
  body: { gap: space.md },
  sub: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  facts: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});

export default History;
