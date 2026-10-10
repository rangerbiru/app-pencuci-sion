import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import { radius, space } from '@/theme';
import { useAppSlice, useQueueItems } from '@/slices';
import { isFeatureEnabled } from '@/utils/config';
import { isoWeekKey, jakarta, remainingText } from '@/utils/date';
import { formatGram, formatRupiah, progressRatio } from '@/utils/format';
import {
  toApiError,
  useGetAttendanceTodayQuery,
  useGetBalanceQuery,
  useGetEarningsQuery,
  useGetMyKpiQuery,
  useGetMyReworkQuery,
  useGetMyWeighingsQuery,
  useGetWorkTodayQuery,
} from '@/services';
import Screen from '@/components/layouts/Screen';
import HomeHeader from '@/components/layouts/HomeHeader';
import Card from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Icon, { IconName } from '@/components/elements/Icon';
import { AccordionItem, useSingleOpen } from '@/components/elements/Accordion';
import { SkeletonList } from '@/components/elements/Skeleton';
import { ErrorState } from '@/components/elements/StateViews';
import { Fab, FadeInItem, PressableScale, ProgressRing } from '@/components/elements/Motion';
import WeighingCard from '../WeighingCard';
import { buildToday, StepState, TodayModel } from '../todaySteps';
import AttendanceHero from './AttendanceHero';

const ROUTES = {
  take: '/ambil-bahan',
  hand_over: '/serah-hasil',
  check_out: '/absen?mode=pulang',
  check_in: '/absen?mode=masuk',
} as const;

interface ActionTile {
  key: string;
  title: string;
  icon: IconName;
  detail: string;
  state: StepState | 'none';
  next: boolean;
  onPress?: () => void;
}

function stateText(state: StepState | 'none', detail: string | null, fallback: string) {
  if (detail) return detail;
  if (state === 'none') return fallback;
  return state === 'active' ? 'Langkah berikutnya' : 'Belum';
}

/** Aksi cepat Hari ini: Ambil bahan, Serah hasil, Kerja ulang. Langkah berikutnya ditandai emas. */
function TodayActions({ model }: { model: TodayModel }) {
  const { colors } = useTheme();
  const take = model.steps.find(s => s.key === 'take');
  const hand = model.steps.find(s => s.key === 'hand_over');
  const offer = model.reworkOffers[0];
  const inDone = model.steps[0]?.state === 'done' || model.steps[0]?.state === 'queued';
  const tiles: ActionTile[] = [
    {
      key: 'take',
      title: 'Ambil bahan',
      icon: 'download',
      state: take?.state ?? 'todo',
      detail: stateText(take?.state ?? 'todo', take?.detail ?? null, ''),
      next: model.next.kind === 'take',
      onPress: inDone ? () => router.push('/ambil-bahan') : undefined,
    },
    {
      key: 'hand',
      title: 'Serah hasil',
      icon: 'upload',
      state: hand?.state ?? 'todo',
      detail: stateText(hand?.state ?? 'todo', hand?.detail ?? null, ''),
      next: model.next.kind === 'hand_over',
      onPress: model.next.kind === 'hand_over' ? () => router.push('/serah-hasil') : undefined,
    },
    {
      key: 'rework',
      title: 'Kerja ulang',
      icon: 'repeat',
      state: offer ? 'active' : 'none',
      detail: offer ? `${offer.label}, ${offer.rework.pcs ?? '-'} pcs` : 'Tidak ada',
      next: false,
      onPress:
        offer && isFeatureEnabled('rework')
          ? () =>
              router.push({
                pathname: '/kerja-ulang',
                params: {
                  mode: offer.kind === 'take_rework' ? 'ambil' : 'serah',
                  id: String(offer.rework.id),
                },
              })
          : undefined,
    },
  ];

  return (
    <View style={styles.tiles}>
      {tiles.map((t, i) => {
        const done = t.state === 'done';
        const disabled = !t.onPress;
        return (
          <FadeInItem key={t.key} index={i} style={styles.flex}>
            <PressableScale
              onPress={t.onPress}
              disabled={disabled && !done}
              accessibilityLabel={`${t.title}. ${t.detail}`}
              style={[
                styles.tile,
                {
                  backgroundColor: t.next ? colors.navIndicator : colors.surface,
                  borderColor: t.next ? colors.fieldFocus : colors.border,
                },
              ]}>
              <View
                style={[
                  styles.tileIcon,
                  {
                    backgroundColor: done
                      ? colors.successBg
                      : t.next
                        ? colors.accent
                        : colors.pressed,
                  },
                ]}>
                <Icon
                  name={done ? 'check' : t.icon}
                  size={20}
                  color={done ? colors.success : t.next ? colors.onAccent : colors.textSecondary}
                />
              </View>
              <Text type="label" numberOfLines={2}>
                {t.title}
              </Text>
              <Text type="caption" color="textSecondary" numberOfLines={2}>
                {t.detail}
              </Text>
            </PressableScale>
          </FadeInItem>
        );
      })}
    </View>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  index,
}: {
  icon: IconName;
  label: string;
  value: string;
  index: number;
}) {
  const { colors } = useTheme();
  return (
    <FadeInItem index={index} style={styles.half}>
      <View
        style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.summaryIcon, { backgroundColor: colors.infoBg }]}>
          <Icon name={icon} size={18} color={colors.info} />
        </View>
        <View style={styles.flexShrink}>
          <Text type="small" color="textSecondary" numberOfLines={1}>
            {label}
          </Text>
          <Text type="number" numberOfLines={1}>
            {value}
          </Text>
        </View>
      </View>
    </FadeInItem>
  );
}

/** Beranda Pencuci v2 (Tahap 14C-R2, layar contoh). */
function PencuciHome() {
  const { colors } = useTheme();
  const { user } = useAppSlice();
  const queue = useQueueItems().filter(q => q.owner === (user?.id ?? null));
  const attendance = useGetAttendanceTodayQuery();
  const work = useGetWorkTodayQuery();
  const rework = useGetMyReworkQuery(undefined, { skip: !isFeatureEnabled('rework') });
  const weighings = useGetMyWeighingsQuery(undefined, { skip: !isFeatureEnabled('weighing') });
  const earnings = useGetEarningsQuery(isoWeekKey());
  const kpi = useGetMyKpiQuery(jakarta().format('YYYY-MM'));
  const balance = useGetBalanceQuery();
  const accordion = useSingleOpen(null);

  const loading = attendance.isLoading || work.isLoading;
  const refreshing = !loading && (attendance.isFetching || work.isFetching || earnings.isFetching);
  const refresh = () => {
    attendance.refetch();
    work.refetch();
    rework.refetch();
    weighings.refetch();
    earnings.refetch();
    kpi.refetch();
    balance.refetch();
  };

  const model = buildToday({
    attendance: attendance.data,
    work: work.data,
    queue,
    rework: rework.data ?? [],
  });
  const queuedIn = queue.some(q => q.kind === 'check_in');
  const queuedOut = queue.some(q => q.kind === 'check_out');
  const pending = (weighings.data ?? []).filter(
    c => c.weighing_confirmation?.status.code === 'menunggu',
  );
  const bonus = earnings.data?.bonus_mingguan;
  const ratio = progressRatio(bonus?.achieved_gram, bonus?.target_gram);
  const b = balance.data;
  const saldo =
    b?.paid_by.code === 'mandor'
      ? (b.mandor_funds?.[0]?.dapat_dicairkan ?? '0.00')
      : b?.dapat_dicairkan;

  const fabAction =
    model.next.kind === 'take' || model.next.kind === 'hand_over' ? model.next : null;

  return (
    <Screen
      header={
        <HomeHeader
          name={user?.name ?? ''}
          subtitle={[
            user?.role.label,
            user?.kepala_pencuci ? `tim ${user.kepala_pencuci.name}` : null,
          ]
            .filter(Boolean)
            .join(', ')}
        />
      }
      gap={space.xl}
      refreshing={refreshing}
      onRefresh={refresh}
      fab={
        fabAction ? (
          <Fab
            label={fabAction.label}
            icon={fabAction.kind === 'take' ? 'download' : 'upload'}
            onPress={() => router.push(ROUTES[fabAction.kind])}
          />
        ) : undefined
      }>
      {loading ? (
        <SkeletonList rows={3} />
      ) : attendance.error && work.error ? (
        <ErrorState error={toApiError(attendance.error)} onRetry={refresh} />
      ) : (
        <>
          <FadeInItem index={0}>
            <AttendanceHero
              attendance={attendance.data}
              queuedIn={queuedIn}
              queuedOut={queuedOut}
            />
          </FadeInItem>

          <View style={styles.section}>
            <Text type="cardTitle" accessibilityRole="header">
              Hari ini
            </Text>
            <TodayActions model={model} />
          </View>

          {pending.map((card, i) => (
            <FadeInItem key={card.id} index={4 + i}>
              <Card
                padded={false}
                style={{ backgroundColor: colors.warningBg, borderColor: colors.warningBg }}>
                <AccordionItem
                  open={accordion.openKey === `w${card.id}`}
                  onToggle={() => accordion.toggle(`w${card.id}`)}
                  divider={false}
                  accessibilityLabel="Konfirmasi hasil timbang"
                  header={
                    <>
                      <Icon name="clock" size={20} color={colors.warning} />
                      <View style={styles.flex}>
                        <Text type="bodyStrong" style={{ color: colors.warning }}>
                          Konfirmasi hasil timbang
                        </Text>
                        <Text type="small" style={{ color: colors.warning }}>
                          {(() => {
                            const left = remainingText(card.weighing_confirmation?.deadline);
                            return left
                              ? `Sisa ${left}. Bila tidak dijawab, dianggap setuju.`
                              : 'Batas waktu sudah lewat.';
                          })()}
                        </Text>
                      </View>
                    </>
                  }>
                  <WeighingCard card={card} onAnswered={() => weighings.refetch()} />
                </AccordionItem>
              </Card>
            </FadeInItem>
          ))}

          {bonus && bonus.target_gram ? (
            <FadeInItem index={5}>
              <Card style={styles.target}>
                <ProgressRing
                  value={ratio}
                  size={88}
                  stroke={9}
                  accessibilityLabel={`Target minggu ini ${Math.round(ratio * 100)} persen`}>
                  <Text type="number">{Math.round(ratio * 100)}%</Text>
                </ProgressRing>
                <View style={styles.flex}>
                  <Text type="cardTitle">Target minggu ini</Text>
                  <Text type="body">
                    {formatGram(bonus.achieved_gram)} dari {formatGram(bonus.target_gram)}
                  </Text>
                  <View style={styles.row}>
                    <Text type="small" color="textSecondary">
                      Bonus {formatRupiah(bonus.amount, { style: 'whole' })}
                    </Text>
                    <Badge status={bonus.status} kind="bonus" />
                  </View>
                </View>
              </Card>
            </FadeInItem>
          ) : null}

          <View style={styles.section}>
            <Text type="cardTitle" accessibilityRole="header">
              Bulan ini
            </Text>
            <View style={styles.grid}>
              <SummaryTile
                index={6}
                icon="calendar"
                label="Hadir"
                value={kpi.data ? `${kpi.data.present_days} hari` : '-'}
              />
              <SummaryTile
                index={7}
                icon="package"
                label="Gram bahan"
                value={formatGram(kpi.data?.material_gram)}
              />
              <SummaryTile
                index={8}
                icon="clock"
                label="Bonus menunggu"
                value={formatRupiah(b?.pending, { style: 'whole' })}
              />
              <SummaryTile
                index={9}
                icon="credit-card"
                label="Saldo"
                value={formatRupiah(saldo, { style: 'whole' })}
              />
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1, minWidth: 0 },
  section: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.md,
    gap: space.xs,
    minHeight: 132,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  target: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  half: { flexBasis: '48%', flexGrow: 1 },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  summary: {
    gap: space.sm,
    borderRadius: radius.tile,
    borderWidth: 1,
    padding: space.md,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PencuciHome;
