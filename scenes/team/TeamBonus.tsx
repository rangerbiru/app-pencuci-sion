import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { space } from '@/theme';
import { KepalaBonusProgress, MemberBonusProgress } from '@/types';
import { toApiError, useGetTeamBonusProgressQuery, staleError, forCurrentArg } from '@/services';
import { useAppSlice } from '@/slices';
import { formatRange, isoWeekKey, jakarta, shiftWeek } from '@/utils/date';
import { formatGram, formatRupiah, progressRatio } from '@/utils/format';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import { IconButton } from '@/components/elements/Button';
import ProgressBar from '@/components/elements/ProgressBar';
import { SkeletonRows } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';

function weekNumber(week: string) {
  return week.split('-W')[1]?.replace(/^0/, '') ?? week;
}

function KepalaCard({ k, showName }: { k: KepalaBonusProgress; showName: boolean }) {
  const w = k.weekly;
  const m = k.monthly;
  return (
    <Card style={styles.gap}>
      {showName ? <Text variant="bodyStrong">{k.user.name}</Text> : null}
      <View style={styles.head}>
        <Text variant="body" style={styles.flex}>
          Bonus mingguan Kepala
        </Text>
        <Badge status={w.status} kind="bonus" />
      </View>
      <ProgressBar
        value={w.members_active ? w.members_achieved / w.members_active : 0}
        label={`${w.members_achieved} dari ${w.members_active} anggota capai target`}
      />
      <Text variant="small" color="textSecondary">
        {w.members_achieved} dari {w.members_active} anggota aktif capai target.{' '}
        {formatRupiah(w.amount)} bila semua capai.
      </Text>
      <View style={[styles.head, styles.top]}>
        <Text variant="body" style={styles.flex}>
          Bonus bulanan Kepala
        </Text>
        <Badge status={m.status} kind="bonus" />
      </View>
      <Text variant="small" color="textSecondary">
        PPE tim {formatRupiah(m.team_ppe)}. {m.members_positive} dari {m.members} anggota PPE di
        atas 0{m.complete ? '' : ', data belum lengkap'}.
      </Text>
    </Card>
  );
}

function MemberRow({ m, last }: { m: MemberBonusProgress; last: boolean }) {
  const { colors } = useTheme();
  const w = m.weekly;
  return (
    <View
      style={[styles.member, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Text variant="bodyStrong">{m.user.name}</Text>
          <Text variant="small" color="textSecondary">
            {m.paid_by.label}
            {m.target_gram_per_day ? `, target ${formatGram(m.target_gram_per_day)}/hari` : ''}
          </Text>
        </View>
        <Badge status={w.status} kind="bonus" />
      </View>
      <ProgressBar
        value={progressRatio(w.achieved_gram, w.target_gram)}
        tone={w.achieved ? 'success' : 'accent'}
        label={`${m.user.name}: ${formatGram(w.achieved_gram)} dari ${formatGram(w.target_gram)}`}
      />
      <Text variant="small" color="textSecondary">
        Mingguan: {formatGram(w.achieved_gram)} dari {formatGram(w.target_gram)}
        {w.amount ? `, bonus ${formatRupiah(w.amount)}` : ''}
      </Text>
      <View style={styles.head}>
        <Text variant="small" color="textSecondary" style={styles.flex}>
          Bulanan: PPE {formatRupiah(m.monthly.ppe)}, {m.monthly.cards} kartu
          {m.monthly.complete ? '' : ', data belum lengkap'}
        </Text>
        <Badge status={m.monthly.status} kind="bonus" />
      </View>
      {m.monthly.notes.map(n => (
        <Text key={n} variant="small" color="textSecondary">
          {n}
        </Text>
      ))}
    </View>
  );
}

/** Progres bonus tim (Kepala Pencuci dan Mandor): target gram mingguan dan PPE bulanan. */
function TeamBonus() {
  const { user } = useAppSlice();
  const currentWeek = isoWeekKey();
  const [week, setWeek] = useState(currentWeek);
  const q = forCurrentArg(useGetTeamBonusProgressQuery({ week }));
  const d = q.data;
  const isMandor = user?.role.code === 'mandor';

  return (
    <Screen
      title="Progres bonus tim"
      back
      refreshing={q.isFetching && !q.isLoading}
      refreshError={staleError(q)}
      onRefresh={q.refetch}>
      <View style={styles.weekPicker}>
        <IconButton
          icon="chevron-left"
          accessibilityLabel="Minggu sebelumnya"
          onPress={() => setWeek(w => shiftWeek(w, -1))}
        />
        <View style={styles.flex}>
          <Text variant="bodyStrong" align="center">
            Minggu {weekNumber(week)}
            {week === currentWeek ? ' (minggu ini)' : ''}
          </Text>
          <Text variant="small" color="textSecondary" align="center">
            {d ? formatRange(d.from, d.to) : ' '}
          </Text>
        </View>
        <IconButton
          icon="chevron-right"
          accessibilityLabel="Minggu berikutnya"
          disabled={week >= currentWeek}
          onPress={() => setWeek(w => shiftWeek(w, 1))}
        />
      </View>

      {q.isLoading ? (
        <SkeletonRows rows={4} />
      ) : q.error && !q.data ? (
        <ErrorState error={toApiError(q.error)} onRetry={q.refetch} />
      ) : d ? (
        <>
          {d.kepala.length > 0 ? (
            <Section
              title={isMandor ? 'Kepala Pencuci' : 'Bonus Kepala'}
              description="Capai bila semua anggota aktif capai target dan PPE di atas 0.">
              {d.kepala.map(k => (
                <KepalaCard key={k.user.id} k={k} showName={isMandor} />
              ))}
            </Section>
          ) : null}
          <Section
            title="Anggota"
            description={`Bulanan: ${jakarta(`${d.month}-01`).format('MMMM YYYY')}${d.month_finished ? '' : ', berjalan'}.`}>
            {d.members.length === 0 ? (
              <Card>
                <EmptyState icon="users" title="Belum ada anggota tim" />
              </Card>
            ) : (
              <Card>
                {d.members.map((m, i) => (
                  <MemberRow key={m.user.id} m={m} last={i === d.members.length - 1} />
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
  top: { marginTop: space.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  weekPicker: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  member: { gap: space.sm, paddingVertical: space.md },
});

export default TeamBonus;
