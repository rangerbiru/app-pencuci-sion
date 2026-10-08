import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import { space } from '@/theme';
import { useAppSlice } from '@/slices';
import { TeamMember } from '@/types';
import {
  toApiError,
  useGetApprovalsQuery,
  useGetBalanceQuery,
  useGetTeamDailyProfitQuery,
  useGetTeamQuery,
} from '@/services';
import { isFeatureEnabled } from '@/utils/config';
import { formatDayShort, formatTime, jakarta } from '@/utils/date';
import { addDecimal } from '@/utils/decimal';
import { formatGram, formatPcs, formatPercent, formatRupiah, progressRatio } from '@/utils/format';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import ListRow from '@/components/elements/ListRow';
import ProgressBar from '@/components/elements/ProgressBar';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';

export function isPresent(m: TeamMember) {
  const code = m.attendance_today?.status?.code;
  return code === 'hadir' || code === 'telat' || !!m.attendance_today?.check_in_at;
}

function MemberRow({ m, last }: { m: TeamMember; last: boolean }) {
  const { colors } = useTheme();
  const remaining = m.rations.length ? addDecimal(...m.rations.map(r => r.remaining_gram)) : null;
  const card = m.card_today;
  return (
    <View
      style={[styles.member, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={styles.memberHead}>
        <View style={styles.flex}>
          <Text variant="bodyStrong">{m.name}</Text>
          <Text variant="small" color="textSecondary">
            {m.role.label}
            {m.attendance_today?.check_in_at
              ? `, masuk ${formatTime(m.attendance_today.check_in_at)}`
              : ''}
            {m.attendance_today?.check_out_at
              ? `, pulang ${formatTime(m.attendance_today.check_out_at)}`
              : ''}
          </Text>
        </View>
        {m.attendance_today?.status ? (
          <Badge status={m.attendance_today.status} kind="attendance" />
        ) : (
          <Badge label="Belum absen" tone="neutral" />
        )}
      </View>
      <View style={styles.facts}>
        <Text variant="small" color="textSecondary">
          Sisa jatah <Text variant="smallStrong">{formatGram(remaining)}</Text>
        </Text>
        <Text variant="small" color="textSecondary">
          Bahan hari ini <Text variant="smallStrong">{formatGram(card?.material_gram)}</Text>
        </Text>
        <Text variant="small" color="textSecondary">
          Lembab{' '}
          <Text variant="smallStrong">
            {card?.pcs_lembab == null ? '-' : `${formatPcs(card.pcs_lembab)} pcs`}
          </Text>
        </Text>
        <Text variant="small" color="textSecondary">
          Hasil <Text variant="smallStrong">{formatGram(card?.result_gram)}</Text>
        </Text>
      </View>
      <View style={styles.badges}>
        {m.attendance_today?.location_flag ? (
          <Badge
            status={m.attendance_today.location_flag}
            kind="attendance_location"
            icon="map-pin"
          />
        ) : null}
        {card?.status ? <Badge status={card.status} kind="daily_work" /> : null}
        {m.pending_submissions > 0 ? (
          <Badge label={`${m.pending_submissions} menunggu verifikasi`} tone="gold" />
        ) : null}
      </View>
    </View>
  );
}

/** Tim: anggota, absen hari ini, jatah, setoran, profit harian tim, bonus tim. */
function Team({ back }: { back?: boolean }) {
  const { user } = useAppSlice();
  const isKepala = user?.role.code === 'kepala_pencuci';
  const team = useGetTeamQuery();
  const approvals = useGetApprovalsQuery(undefined, { skip: !isFeatureEnabled('approvals') });
  const today = jakarta();
  const profit = useGetTeamDailyProfitQuery(
    { from: today.subtract(6, 'day').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') },
    { skip: !isFeatureEnabled('dailyProfit') },
  );
  const balance = useGetBalanceQuery(undefined, {
    skip: !isKepala || !isFeatureEnabled('earnings'),
  });
  const teamBonus = balance.data?.pending_items.find(
    p => p.kind === 'bonus_mingguan' && p.progress?.unit === 'anggota',
  );

  const members = team.data ?? [];
  const workers = members.filter(m => m.role.code === 'pencuci');
  const present = workers.filter(isPresent).length;

  return (
    <Screen
      title="Tim"
      subtitle={team.data ? `${present} dari ${workers.length} pencuci hadir` : undefined}
      back={back}
      refreshing={team.isFetching && !team.isLoading}
      onRefresh={() => {
        team.refetch();
        approvals.refetch();
        profit.refetch();
      }}>
      {isKepala ? (
        <Card padded={false}>
          {isFeatureEnabled('approvals') ? (
            <ListRow
              title="Verifikasi"
              subtitle={
                approvals.data
                  ? `${approvals.data.meta.total} pengajuan menunggu`
                  : 'Pengajuan anggota tim'
              }
              onPress={() => router.push('/tim-verifikasi')}
            />
          ) : null}
          {isFeatureEnabled('workCards') ? (
            <ListRow
              title="Kartu Kerja"
              subtitle="Hasil standar dan QC"
              onPress={() => router.push('/tim-kartu')}
            />
          ) : null}
          {isFeatureEnabled('batches') ? (
            <ListRow
              title="Batch dan penjatahan"
              subtitle="Bila diizinkan Mandor dan Admin"
              onPress={() => router.push('/tim-batch')}
              divider={false}
            />
          ) : null}
        </Card>
      ) : null}

      {teamBonus?.progress?.achieved !== undefined && teamBonus.progress.target !== undefined ? (
        <Section
          title="Bonus tim minggu ini"
          description="Capai bila semua anggota aktif mencapai target.">
          <Card style={styles.gap}>
            <View style={styles.memberHead}>
              <Text variant="numberM" style={styles.flex}>
                {teamBonus.progress.achieved.replace(/\.00$/, '')} dari{' '}
                {teamBonus.progress.target.replace(/\.00$/, '')} anggota
              </Text>
              <Badge status={teamBonus.status} kind="bonus" />
            </View>
            <ProgressBar
              value={progressRatio(teamBonus.progress.achieved, teamBonus.progress.target)}
              label="Anggota yang sudah capai target"
            />
            <Text variant="small" color="textSecondary">
              Terakumulasi {formatRupiah(teamBonus.amount)}
              {teamBonus.full_amount ? ` dari ${formatRupiah(teamBonus.full_amount)}` : ''}
            </Text>
          </Card>
        </Section>
      ) : null}

      <Section title="Anggota hari ini">
        {team.isLoading ? (
          <SkeletonList rows={4} />
        ) : team.error ? (
          <ErrorState error={toApiError(team.error)} onRetry={team.refetch} />
        ) : members.length === 0 ? (
          <Card>
            <EmptyState
              icon="users"
              title="Belum ada anggota tim"
              message="Hubungi Admin untuk mengatur tim."
              actionLabel="Muat ulang"
              onAction={team.refetch}
            />
          </Card>
        ) : (
          <Card style={styles.tight}>
            {members.map((m, i) => (
              <MemberRow key={m.id} m={m} last={i === members.length - 1} />
            ))}
          </Card>
        )}
      </Section>

      {isFeatureEnabled('dailyProfit') && profit.data && profit.data.data.length > 0 ? (
        <Section title="Profit harian tim" description="Laba = nilai jual - HPP bahan - upah.">
          <Card style={styles.tight}>
            {profit.data.data.map((d, i) => (
              <View
                key={d.date}
                style={[styles.profit, i < (profit.data?.data.length ?? 0) - 1 && styles.divider]}>
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{formatDayShort(d.date)}</Text>
                  <Text variant="small" color="textSecondary">
                    {d.cards} kartu{d.complete ? '' : ', sebagian upah belum dihitung'}
                  </Text>
                </View>
                <View style={styles.right}>
                  <Text variant="bodyStrong" style={styles.tabular}>
                    {formatRupiah(d.laba)}
                  </Text>
                  <Text variant="small" color="textSecondary">
                    {formatPercent(d.persen)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.sm },
  tight: { paddingVertical: space.xs },
  member: { paddingVertical: space.md, gap: space.sm },
  memberHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  facts: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.md, rowGap: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  profit: { flexDirection: 'row', gap: space.md, paddingVertical: space.md },
  divider: { borderBottomWidth: 1, borderBottomColor: 'transparent' },
  right: { alignItems: 'flex-end' },
  tabular: { fontVariant: ['tabular-nums'] },
});

export default Team;
