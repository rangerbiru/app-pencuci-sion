import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import useNow from '@/hooks/useNow';
import { sizes, space } from '@/theme';
import { useAppSlice } from '@/slices';
import { isFeatureEnabled } from '@/utils/config';
import { formatDayLong, formatTime, greeting } from '@/utils/date';
import {
  toApiError,
  useGetApprovalsQuery,
  useGetAttendanceTodayQuery,
  useGetIncomingBatchesQuery,
  useGetTeamQuery,
  useGetTeamWithdrawalsQuery,
  useGetWorkCardsQuery,
} from '@/services';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import Button from '@/components/elements/Button';
import Icon, { IconName } from '@/components/elements/Icon';
import { SkeletonList } from '@/components/elements/Skeleton';
import { ErrorState } from '@/components/elements/StateViews';
import { isPresent } from '@/scenes/team/Team';

interface FigureProps {
  icon: IconName;
  value: string;
  label: string;
  attention?: boolean;
  onPress: () => void;
}

/** Satu angka ringkasan yang membuka layarnya. Angka perlu tindakan diberi aksen emas. */
function FigureRow({ icon, value, label, attention, onPress }: FigureProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [
        styles.figure,
        { borderBottomColor: colors.border },
        pressed && { backgroundColor: colors.pressed },
      ]}>
      <View
        style={[
          styles.figureIcon,
          { backgroundColor: attention ? colors.warningBg : colors.surfaceSunken },
        ]}>
        <Icon name={icon} size={20} color={attention ? colors.warning : colors.textSecondary} />
      </View>
      <Text variant="body" style={styles.flex}>
        {label}
      </Text>
      <Text variant="numberM" color={attention ? 'warning' : 'text'}>
        {value}
      </Text>
      <Icon name="chevron-right" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

/** Beranda Mandor: ringkasan tim hari ini dan absen sendiri. */
function MandorHome() {
  const { user } = useAppSlice();
  const now = useNow(60000);
  const today = now.format('YYYY-MM-DD');
  const team = useGetTeamQuery(undefined, { skip: !isFeatureEnabled('team') });
  const approvals = useGetApprovalsQuery(undefined, { skip: !isFeatureEnabled('approvals') });
  const cards = useGetWorkCardsQuery({ date: today }, { skip: !isFeatureEnabled('workCards') });
  const incoming = useGetIncomingBatchesQuery(undefined, { skip: !isFeatureEnabled('batches') });
  const withdrawals = useGetTeamWithdrawalsQuery(
    { status: 'diajukan' },
    { skip: !isFeatureEnabled('teamWithdrawals') },
  );
  const attendance = useGetAttendanceTodayQuery(undefined, {
    skip: !isFeatureEnabled('attendance'),
  });

  const workers = (team.data ?? []).filter(m => m.role.code === 'pencuci');
  const present = workers.filter(isPresent).length;
  const notQc = (cards.data?.data ?? []).filter(c => !c.qc_status).length;
  const loading = team.isLoading && approvals.isLoading;
  const refresh = () => {
    team.refetch();
    approvals.refetch();
    cards.refetch();
    incoming.refetch();
    withdrawals.refetch();
    attendance.refetch();
  };

  const checkedIn = !!attendance.data?.check_in.at;
  const checkedOut = !!attendance.data?.check_out.at;

  return (
    <Screen
      title={`${greeting(now)}, ${user?.name ?? ''}`}
      subtitle={formatDayLong(today)}
      refreshing={team.isFetching && !loading}
      onRefresh={refresh}>
      <Section title="Tim hari ini">
        {loading ? (
          <SkeletonList rows={4} />
        ) : team.error && approvals.error ? (
          <ErrorState error={toApiError(team.error)} onRetry={refresh} />
        ) : (
          <Card padded={false} style={styles.figures}>
            {isFeatureEnabled('team') ? (
              <FigureRow
                icon="users"
                label="Pencuci hadir"
                value={team.data ? `${present} / ${workers.length}` : '-'}
                attention={!!team.data && present < workers.length}
                onPress={() => router.push('/anggota')}
              />
            ) : null}
            {isFeatureEnabled('approvals') ? (
              <FigureRow
                icon="check-square"
                label="Menunggu verifikasi"
                value={approvals.data ? String(approvals.data.meta.total) : '-'}
                attention={(approvals.data?.meta.total ?? 0) > 0}
                onPress={() => router.push('/verifikasi')}
              />
            ) : null}
            {isFeatureEnabled('workCards') ? (
              <FigureRow
                icon="clipboard"
                label="Kartu belum QC"
                value={cards.data ? String(notQc) : '-'}
                attention={notQc > 0}
                onPress={() => router.push('/kartu')}
              />
            ) : null}
            {isFeatureEnabled('batches') ? (
              <FigureRow
                icon="package"
                label="Batch belum diterima"
                value={incoming.data ? String(incoming.data.length) : '-'}
                attention={(incoming.data?.length ?? 0) > 0}
                onPress={() => router.push('/batch')}
              />
            ) : null}
            {isFeatureEnabled('teamWithdrawals') ? (
              <FigureRow
                icon="dollar-sign"
                label="Penarikan Borongan menunggu"
                value={withdrawals.data ? String(withdrawals.data.meta.total) : '-'}
                attention={(withdrawals.data?.meta.total ?? 0) > 0}
                onPress={() => router.push('/penarikan-tim')}
              />
            ) : null}
          </Card>
        )}
      </Section>

      {isFeatureEnabled('attendance') ? (
        <Section title="Absen saya">
          <Card style={styles.attendance}>
            <Text variant="body" color="textSecondary">
              {checkedOut
                ? `Masuk ${formatTime(attendance.data?.check_in.at)}, pulang ${formatTime(attendance.data?.check_out.at)}.`
                : checkedIn
                  ? `Masuk jam ${formatTime(attendance.data?.check_in.at)}.`
                  : 'Belum absen masuk hari ini.'}
            </Text>
            {!checkedOut ? (
              <Button
                title={checkedIn ? 'Absen pulang' : 'Absen masuk'}
                variant={checkedIn ? 'secondary' : 'primary'}
                icon="camera"
                onPress={() => router.push(checkedIn ? '/absen?mode=pulang' : '/absen?mode=masuk')}
              />
            ) : null}
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  figures: { overflow: 'hidden' },
  figure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: sizes.primaryButton + space.sm,
    paddingHorizontal: space.lg,
    borderBottomWidth: 1,
  },
  figureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendance: { gap: space.md },
});

export default MandorHome;
