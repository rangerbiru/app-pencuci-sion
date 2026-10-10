import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import { palette, radius, space } from '@/theme';
import { useAppSlice } from '@/slices';
import { isFeatureEnabled } from '@/utils/config';
import { jakarta } from '@/utils/date';
import { addDecimal, compareDecimal, subDecimal, toCents } from '@/utils/decimal';
import { formatGram } from '@/utils/format';
import {
  toApiError,
  useGetApprovalsQuery,
  useGetAttendanceTodayQuery,
  useGetIncomingBatchesQuery,
  useGetRationBatchesQuery,
  useGetTeamQuery,
  useGetTeamWithdrawalsQuery,
  useGetWorkCardsQuery,
  staleError,
} from '@/services';
import { WorkCard } from '@/types';
import Screen from '@/components/layouts/Screen';
import HomeHeader from '@/components/layouts/HomeHeader';
import Card from '@/components/elements/Card';
import Button from '@/components/elements/Button';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Icon, { IconName } from '@/components/elements/Icon';
import { SkeletonHero } from '@/components/elements/Skeleton';
import { ErrorState } from '@/components/elements/StateViews';
import {
  Donut,
  DonutSlice,
  Fab,
  FadeInItem,
  HeroSurface,
  onHero,
  PressableScale,
  ProgressBarV2,
} from '@/components/elements/Motion';
import { isPresent } from '@/scenes/team/Team';
import AttendanceCard from '../AttendanceCard';

const GROUPS: { key: string; label: string; color: string }[] = [
  { key: 'utuh', label: 'Utuh', color: palette.accent['500'] },
  { key: 'kecil', label: 'Kecil', color: palette.gold['500'] },
  { key: 'hancur', label: 'Hancur', color: palette.primary['300'] },
  { key: 'kotor', label: 'Kotor', color: palette.gray['400'] },
];

/** Jumlah gram hasil per kategori dari kartu 7 hari terakhir. */
function yieldByGroup(cards: WorkCard[], fromDate: string) {
  const sums: Record<string, string> = {};
  for (const c of cards) {
    if (c.work_date < fromDate) continue;
    for (const g of c.result.groups) sums[g.group] = addDecimal(sums[g.group] ?? '0', g.gram);
  }
  return sums;
}

function StatTile({
  icon,
  label,
  value,
  attention,
  onPress,
  index,
}: {
  icon: IconName;
  label: string;
  value: string;
  attention?: boolean;
  onPress: () => void;
  index: number;
}) {
  const { colors } = useTheme();
  return (
    <FadeInItem index={index} style={styles.half}>
      <PressableScale
        onPress={onPress}
        accessibilityLabel={`${label}: ${value}`}
        style={[
          styles.stat,
          {
            backgroundColor: attention ? colors.navIndicator : colors.surface,
            borderColor: attention ? colors.fieldFocus : colors.border,
          },
        ]}>
        <View style={styles.statTop}>
          <Icon
            name={icon}
            size={18}
            color={attention ? colors.onNavIndicator : colors.textSecondary}
          />
          <Text type="numberL" style={{ color: attention ? colors.onNavIndicator : colors.text }}>
            {value}
          </Text>
        </View>
        <Text type="small" color="textSecondary" numberOfLines={2}>
          {label}
        </Text>
      </PressableScale>
    </FadeInItem>
  );
}

/** Beranda Mandor v2 (Tahap 14C-R2, layar contoh). */
function MandorHome() {
  const { colors } = useTheme();
  const { user } = useAppSlice();
  const today = jakarta().format('YYYY-MM-DD');
  const weekAgo = jakarta().subtract(6, 'day').format('YYYY-MM-DD');
  const incoming = useGetIncomingBatchesQuery(undefined, { skip: !isFeatureEnabled('batches') });
  const rations = useGetRationBatchesQuery(undefined, { skip: !isFeatureEnabled('rations') });
  const team = useGetTeamQuery(undefined, { skip: !isFeatureEnabled('team') });
  const approvals = useGetApprovalsQuery(undefined, { skip: !isFeatureEnabled('approvals') });
  const todayCards = useGetWorkCardsQuery(
    { date: today },
    { skip: !isFeatureEnabled('workCards') },
  );
  const recentCards = useGetWorkCardsQuery({ page: 1 }, { skip: !isFeatureEnabled('workCards') });
  const withdrawals = useGetTeamWithdrawalsQuery(
    { status: 'diajukan' },
    { skip: !isFeatureEnabled('teamWithdrawals') },
  );
  const attendance = useGetAttendanceTodayQuery(undefined, {
    skip: !isFeatureEnabled('attendance'),
  });

  const loading = incoming.isLoading && team.isLoading;
  const refresh = () => {
    incoming.refetch();
    rations.refetch();
    team.refetch();
    approvals.refetch();
    todayCards.refetch();
    recentCards.refetch();
    withdrawals.refetch();
    attendance.refetch();
  };

  const firstIncoming = incoming.data?.[0];
  const workers = (team.data ?? []).filter(m => m.role.code === 'pencuci');
  const present = workers.filter(isPresent).length;
  const notQc = (todayCards.data?.data ?? []).filter(c => !c.qc_status).length;
  const waiting = approvals.data?.meta.total ?? 0;
  const wd = withdrawals.data?.meta.total ?? 0;

  const active = (rations.data ?? []).filter(b => b.status.code !== 'completed');
  const sums = yieldByGroup(recentCards.data?.data ?? [], weekAgo);
  const totalGram = addDecimal(...Object.values(sums));
  const slices: DonutSlice[] = GROUPS.map(g => ({
    key: g.key,
    label: g.label,
    color: g.color,
    value: Number(toCents(sums[g.key] ?? '0') ?? 0n) / 100,
  }));

  return (
    <Screen
      header={<HomeHeader name={user?.name ?? ''} subtitle={user?.role.label} />}
      gap={space.xl}
      refreshing={!loading && (incoming.isFetching || team.isFetching)}
      refreshError={staleError(
        incoming,
        rations,
        team,
        approvals,
        todayCards,
        recentCards,
        withdrawals,
        attendance,
      )}
      onRefresh={refresh}
      fab={
        firstIncoming ? (
          <Fab
            label="Terima batch"
            icon="inbox"
            onPress={() =>
              router.push({
                pathname: '/batch/terima/[id]',
                params: { id: String(firstIncoming.id) },
              })
            }
          />
        ) : undefined
      }>
      {loading ? (
        <SkeletonHero />
      ) : incoming.error && team.error ? (
        <ErrorState error={toApiError(incoming.error)} onRetry={refresh} />
      ) : (
        <>
          <FadeInItem index={0}>
            <HeroSurface>
              <View style={styles.heroHead}>
                <Text type="small" style={{ color: onHero.muted }}>
                  Batch masuk
                </Text>
                {incoming.data && incoming.data.length > 1 ? (
                  <Text type="small" style={{ color: onHero.muted }}>
                    {incoming.data.length} menunggu
                  </Text>
                ) : null}
              </View>
              {firstIncoming ? (
                <>
                  <View style={styles.gapXs}>
                    <Text type="screenTitle" style={{ color: onHero.text }}>
                      {firstIncoming.batch_code}
                    </Text>
                    <Text type="small" style={{ color: onHero.muted }}>
                      {firstIncoming.item}
                      {firstIncoming.grades.length
                        ? `, grade ${firstIncoming.grades.join(' dan ')}`
                        : ''}
                    </Text>
                  </View>
                  <View style={styles.heroRow}>
                    <View style={styles.flex}>
                      <Text type="small" style={{ color: onHero.muted }}>
                        Dikirim
                      </Text>
                      <Text type="numberXL" style={{ color: onHero.text }}>
                        {formatGram(firstIncoming.sent_gram)}
                      </Text>
                    </View>
                    <Button
                      title="Terima"
                      icon="inbox"
                      accessibilityLabel={`Terima batch ${firstIncoming.batch_code}`}
                      onPress={() =>
                        router.push({
                          pathname: '/batch/terima/[id]',
                          params: { id: String(firstIncoming.id) },
                        })
                      }
                    />
                  </View>
                </>
              ) : (
                <View style={styles.gapXs}>
                  <Text type="cardTitle" style={{ color: onHero.text }}>
                    Tidak ada batch yang menunggu diterima
                  </Text>
                  <Text type="small" style={{ color: onHero.muted }}>
                    Batch baru dari gudang muncul di sini dan di lonceng.
                  </Text>
                </View>
              )}
            </HeroSurface>
          </FadeInItem>

          <View style={styles.grid}>
            <StatTile
              index={1}
              icon="users"
              label="Pencuci hadir"
              value={team.data ? `${present}/${workers.length}` : '-'}
              attention={!!team.data && present < workers.length}
              onPress={() => router.push('/anggota')}
            />
            <StatTile
              index={2}
              icon="check-square"
              label="Menunggu verifikasi"
              value={approvals.data ? String(waiting) : '-'}
              attention={waiting > 0}
              onPress={() => router.push('/verifikasi')}
            />
            <StatTile
              index={3}
              icon="clipboard"
              label="Kartu belum QC hari ini"
              value={todayCards.data ? String(notQc) : '-'}
              attention={notQc > 0}
              onPress={() => router.push('/kartu')}
            />
            <StatTile
              index={4}
              icon="credit-card"
              label="Penarikan Borongan"
              value={withdrawals.data ? String(wd) : '-'}
              attention={wd > 0}
              onPress={() => router.push('/penarikan-tim')}
            />
          </View>

          {active.length > 0 ? (
            <View style={styles.section}>
              <Text type="cardTitle" accessibilityRole="header">
                Batch dan penjatahan
              </Text>
              {active.slice(0, 4).map((b, i) => {
                const received = b.received_gram ?? '0.00';
                const left = b.remaining_gram ?? '0.00';
                const rationed = subDecimal(received, left);
                const ratio =
                  compareDecimal(received, '0') > 0
                    ? Number(toCents(rationed) ?? 0n) / Number(toCents(received) ?? 1n)
                    : 0;
                return (
                  <FadeInItem key={b.id} index={5 + i}>
                    <PressableScale
                      onPress={() => router.push('/batch')}
                      accessibilityLabel={`${b.batch_code}, ${Math.round(ratio * 100)} persen dijatah`}
                      style={[
                        styles.batch,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}>
                      <View style={styles.batchHead}>
                        <View style={styles.flex}>
                          <Text type="bodyStrong">{b.batch_code}</Text>
                          <Text type="small" color="textSecondary">
                            {b.item}
                          </Text>
                        </View>
                        <Badge status={b.status} kind="batch" />
                      </View>
                      <ProgressBarV2
                        value={ratio}
                        delayMs={i * 60}
                        accessibilityLabel={`${b.batch_code} dijatah ${Math.round(ratio * 100)} persen`}
                      />
                      <Text type="small" color="textSecondary">
                        {compareDecimal(left, '0') > 0
                          ? `${formatGram(left)} belum dijatah dari ${formatGram(received)}`
                          : `Semua ${formatGram(received)} sudah dijatah`}
                      </Text>
                    </PressableScale>
                  </FadeInItem>
                );
              })}
            </View>
          ) : null}

          {compareDecimal(totalGram, '0') > 0 ? (
            <Card style={styles.donutCard}>
              <Text type="cardTitle" accessibilityRole="header">
                Hasil 7 hari terakhir
              </Text>
              <View style={styles.donutRow}>
                <Donut
                  slices={slices}
                  accessibilityLabel={`Hasil 7 hari ${formatGram(totalGram)}: ${slices
                    .map(s => `${s.label} ${formatGram(sums[s.key] ?? '0')}`)
                    .join(', ')}`}>
                  <Text type="caption" color="textSecondary">
                    Total
                  </Text>
                  <Text type="number">{formatGram(totalGram)}</Text>
                </Donut>
                <View style={styles.legend}>
                  {slices.map(s => {
                    const pct =
                      Number(totalGram) > 0 ? Math.round((s.value / Number(totalGram)) * 100) : 0;
                    return (
                      <View key={s.key} style={styles.legendRow}>
                        <View style={[styles.swatch, { backgroundColor: s.color }]} />
                        <Text type="small" style={styles.flex}>
                          {s.label}
                        </Text>
                        <Text type="label">{pct}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Card>
          ) : null}

          {isFeatureEnabled('attendance') ? <AttendanceCard /> : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gapXs: { gap: space.xxs },
  section: { gap: space.md },
  heroHead: { flexDirection: 'row', justifyContent: 'space-between' },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  half: { flexBasis: '48%', flexGrow: 1 },
  stat: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.md,
    gap: space.xs,
    minHeight: 92,
  },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  batch: { borderRadius: radius.card, borderWidth: 1, padding: space.lg, gap: space.sm },
  batchHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  donutCard: { gap: space.md },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
  legend: { flex: 1, gap: space.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  swatch: { width: 12, height: 12, borderRadius: 6 },
});

export default MandorHome;
