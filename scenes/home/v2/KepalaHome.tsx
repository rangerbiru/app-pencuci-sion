import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import { radius, space } from '@/theme';
import { useAppSlice, useQueueItems } from '@/slices';
import { isFeatureEnabled } from '@/utils/config';
import { formatGram, formatRupiah, progressRatio } from '@/utils/format';
import {
  toApiError,
  useGetApprovalsQuery,
  useGetAttendanceTodayQuery,
  useGetBalanceQuery,
  useGetTeamBonusProgressQuery,
  staleError,
} from '@/services';
import Screen from '@/components/layouts/Screen';
import HomeHeader from '@/components/layouts/HomeHeader';
import Card from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Icon, { IconName } from '@/components/elements/Icon';
import { SkeletonHero, SkeletonRows } from '@/components/elements/Skeleton';
import { ErrorState } from '@/components/elements/StateViews';
import {
  FadeInItem,
  PressableScale,
  ProgressBarV2,
  ProgressRing,
} from '@/components/elements/Motion';
import AttendanceHero from './AttendanceHero';

function LinkTile({
  icon,
  label,
  value,
  attention,
  onPress,
  index,
}: {
  icon: IconName;
  label: string;
  value?: string;
  attention?: boolean;
  onPress: () => void;
  index: number;
}) {
  const { colors } = useTheme();
  return (
    <FadeInItem index={index} style={styles.half}>
      <PressableScale
        onPress={onPress}
        accessibilityLabel={value ? `${label}: ${value}` : label}
        style={[
          styles.tile,
          {
            backgroundColor: attention ? colors.navIndicator : colors.surface,
            borderColor: attention ? colors.fieldFocus : colors.border,
          },
        ]}>
        <View style={styles.tileTop}>
          <Icon
            name={icon}
            size={18}
            color={attention ? colors.onNavIndicator : colors.textSecondary}
          />
          {value && value.length <= 4 ? (
            <Text type="numberL" style={{ color: attention ? colors.onNavIndicator : colors.text }}>
              {value}
            </Text>
          ) : null}
        </View>
        {value && value.length > 4 ? <Text type="number">{value}</Text> : null}
        <Text type="small" color="textSecondary" numberOfLines={2}>
          {label}
        </Text>
      </PressableScale>
    </FadeInItem>
  );
}

/** Beranda Kepala Pencuci v2: absen sendiri, progres bonus tim, anggota, pintu kerja tim. */
function KepalaHome() {
  const { user } = useAppSlice();
  const queue = useQueueItems().filter(q => q.owner === (user?.id ?? null));
  const attendance = useGetAttendanceTodayQuery();
  const bonus = useGetTeamBonusProgressQuery();
  const approvals = useGetApprovalsQuery(undefined, { skip: !isFeatureEnabled('approvals') });
  const balance = useGetBalanceQuery(undefined, { skip: !isFeatureEnabled('earnings') });

  const refresh = () => {
    attendance.refetch();
    bonus.refetch();
    approvals.refetch();
    balance.refetch();
  };
  const k = bonus.data?.kepala[0];
  const members = bonus.data?.members ?? [];
  const achieved = k?.weekly.members_achieved ?? 0;
  const activeCount = k?.weekly.members_active ?? members.length;
  const waiting = approvals.data?.meta.total ?? 0;
  const b = balance.data;
  const saldo =
    b?.paid_by.code === 'mandor'
      ? (b.mandor_funds?.[0]?.dapat_dicairkan ?? '0.00')
      : b?.dapat_dicairkan;

  return (
    <Screen
      header={
        <HomeHeader
          name={user?.name ?? ''}
          subtitle={[user?.role.label, user?.mandor ? `Mandor ${user.mandor.name}` : null]
            .filter(Boolean)
            .join(', ')}
        />
      }
      gap={space.xl}
      refreshing={!attendance.isLoading && (attendance.isFetching || bonus.isFetching)}
      refreshError={staleError(attendance, bonus, approvals, balance)}
      onRefresh={refresh}>
      {attendance.isLoading ? (
        <SkeletonHero />
      ) : (
        <FadeInItem index={0}>
          <AttendanceHero
            attendance={attendance.data}
            queuedIn={queue.some(q => q.kind === 'check_in')}
            queuedOut={queue.some(q => q.kind === 'check_out')}
          />
        </FadeInItem>
      )}

      <View style={styles.grid}>
        <LinkTile
          index={1}
          icon="check-square"
          label="Menunggu verifikasi"
          value={approvals.data ? String(waiting) : undefined}
          attention={waiting > 0}
          onPress={() => router.push('/tim-verifikasi')}
        />
        <LinkTile
          index={2}
          icon="users"
          label="Tim saya hari ini"
          onPress={() => router.push('/tim')}
        />
        <LinkTile
          index={3}
          icon="clipboard"
          label="Kartu Kerja tim"
          onPress={() => router.push('/tim-kartu')}
        />
        <LinkTile
          index={4}
          icon="credit-card"
          label="Saldo saya"
          value={b ? formatRupiah(saldo, { style: 'whole' }) : undefined}
          onPress={() => router.push('/pendapatan')}
        />
      </View>

      {bonus.isLoading ? (
        <SkeletonRows rows={2} />
      ) : bonus.error && !bonus.data ? (
        <ErrorState error={toApiError(bonus.error)} onRetry={bonus.refetch} />
      ) : (
        <>
          <FadeInItem index={5}>
            <PressableScale
              onPress={() => router.push('/bonus-tim')}
              accessibilityLabel={`${achieved} dari ${activeCount} anggota capai target minggu ini`}>
              <Card style={styles.teamCard}>
                <ProgressRing
                  value={activeCount ? achieved / activeCount : 0}
                  size={84}
                  stroke={9}
                  accessibilityLabel={`${achieved} dari ${activeCount} anggota capai target`}>
                  <Text type="number">
                    {achieved}/{activeCount}
                  </Text>
                </ProgressRing>
                <View style={styles.flex}>
                  <Text type="cardTitle">Anggota capai target</Text>
                  <Text type="small" color="textSecondary">
                    Bonus Kepala {formatRupiah(k?.weekly.amount, { style: 'whole' })} bila semua
                    anggota aktif capai.
                  </Text>
                  {k ? <Badge status={k.weekly.status} kind="bonus" /> : null}
                </View>
              </Card>
            </PressableScale>
          </FadeInItem>

          <View style={styles.section}>
            <Text type="cardTitle" accessibilityRole="header">
              Anggota minggu ini
            </Text>
            {members.map((m, i) => {
              const ratio = progressRatio(m.weekly.achieved_gram, m.weekly.target_gram);
              return (
                <FadeInItem key={m.user.id} index={6 + i}>
                  <Card style={styles.member}>
                    <View style={styles.memberHead}>
                      <Text type="bodyStrong" style={styles.flex}>
                        {m.user.name}
                      </Text>
                      <Badge status={m.weekly.status} kind="bonus" />
                    </View>
                    <ProgressBarV2
                      value={ratio}
                      delayMs={i * 60}
                      accessibilityLabel={`${m.user.name} ${formatGram(m.weekly.achieved_gram)} dari ${formatGram(m.weekly.target_gram)}`}
                    />
                    <Text type="small" color="textSecondary">
                      {formatGram(m.weekly.achieved_gram)} dari {formatGram(m.weekly.target_gram)}
                    </Text>
                  </Card>
                </FadeInItem>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.xs },
  section: { gap: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  half: { flexBasis: '48%', flexGrow: 1 },
  tile: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.md,
    gap: space.xs,
    minHeight: 88,
  },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamCard: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  member: { gap: space.sm },
  memberHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});

export default KepalaHome;
