import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import { sizes, space } from '@/theme';
import { isFeatureEnabled } from '@/utils/config';
import {
  formatDate,
  formatDayShort,
  formatRange,
  isoWeekKey,
  shiftWeek,
  jakarta,
} from '@/utils/date';
import { formatGram, formatPercent, formatRupiah, progressRatio } from '@/utils/format';
import {
  toApiError,
  useGetBalanceQuery,
  useGetEarningsQuery,
  useGetMyDailyProfitQuery,
} from '@/services';
import { EarningsDay, PendingItem } from '@/types';
import { useAppSlice } from '@/slices';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import Amount from '@/components/elements/Amount';
import Badge from '@/components/elements/Badge';
import Button, { IconButton } from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import Icon from '@/components/elements/Icon';
import ProgressBar from '@/components/elements/ProgressBar';
import { SkeletonList } from '@/components/elements/Skeleton';
import { ErrorState } from '@/components/elements/StateViews';
import MoneyRow from './MoneyRow';

function weekNumber(week: string) {
  return week.split('-W')[1]?.replace(/^0/, '') ?? week;
}

function DayRow({ day }: { day: EarningsDay }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Pressable
        onPress={() => setOpen(o => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${formatDayShort(day.date)}, ${day.attendance?.label ?? 'tanpa absen'}. Ketuk untuk ${open ? 'menutup' : 'melihat'} rincian`}
        style={styles.dayRow}>
        <View style={styles.flex}>
          <Text variant="bodyStrong">{formatDayShort(day.date)}</Text>
          <Text variant="small" color="textSecondary">
            Bahan {formatGram(day.material_gram)}
          </Text>
        </View>
        {day.attendance ? <Badge status={day.attendance} kind="attendance" /> : null}
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
      </Pressable>
      {open ? (
        <View style={styles.dayDetail}>
          <MoneyRow label="Gaji harian" amount={day.gaji_harian} />
          <MoneyRow
            label="Upah sudah dihitung"
            amount={day.upah_sudah_dihitung}
            divider={day.cards.length > 0}
          />
          {day.cards.map(c => (
            <View key={c.id} style={styles.cardRow}>
              <View style={styles.flex}>
                <Text variant="small">Kartu kerja</Text>
                <View style={styles.badges}>
                  <Badge status={c.status} kind="daily_work" />
                  {c.wage ? <Badge status={c.wage.status} kind="card_wage" prefix="Upah" /> : null}
                </View>
                {c.wage?.reason ? (
                  <Text variant="small" color="textSecondary">
                    {c.wage.reason}
                  </Text>
                ) : null}
              </View>
              <Text variant="bodyStrong" style={styles.tabular}>
                {formatRupiah(c.wage?.amount)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PendingRow({ item }: { item: PendingItem }) {
  const p = item.progress;
  let progressText: string | null = null;
  let ratio = 0;
  if (p?.achieved !== undefined && p?.target !== undefined) {
    ratio = progressRatio(p.achieved, p.target);
    progressText =
      p.unit === 'anggota'
        ? `${p.achieved.replace(/\.00$/, '')} dari ${p.target.replace(/\.00$/, '')} anggota capai target`
        : `${formatGram(p.achieved)} dari target ${formatGram(p.target)}`;
  } else if (p?.ppe !== undefined) {
    progressText = `PPE berjalan ${formatRupiah(p.ppe)}`;
  } else if (p?.base !== undefined) {
    progressText = `Dari penghasilan ${formatRupiah(p.base)}`;
  }
  return (
    <View style={styles.pending}>
      <View style={styles.pendingHead}>
        <View style={styles.flex}>
          <Text variant="bodyStrong">{item.label}</Text>
          <Badge status={item.status} kind={item.kind === 'upah' ? 'card_wage' : 'bonus'} />
        </View>
        <View style={styles.right}>
          <Text variant="bodyStrong" style={styles.tabular}>
            {formatRupiah(item.amount)}
          </Text>
          {item.full_amount ? (
            <Text variant="small" color="textSecondary">
              penuh {formatRupiah(item.full_amount)}
            </Text>
          ) : null}
        </View>
      </View>
      {progressText ? (
        <>
          {p?.target !== undefined ? <ProgressBar value={ratio} label={progressText} /> : null}
          <Text variant="small" color="textSecondary">
            {progressText}
            {p?.present_days !== undefined ? `, hadir ${p.present_days} hari` : ''}
          </Text>
        </>
      ) : null}
      {item.reason ? (
        <Text variant="small" color="textSecondary">
          {item.reason}
        </Text>
      ) : null}
    </View>
  );
}

/** Pendapatan: pilih minggu, total, rincian per hari, bonus berjalan, profit harian, saldo. */
function Earnings() {
  const { user } = useAppSlice();
  const [week, setWeek] = useState(() => isoWeekKey());
  const currentWeek = isoWeekKey();
  const earnings = useGetEarningsQuery(week);
  const balance = useGetBalanceQuery();
  const today = jakarta();
  const profit = useGetMyDailyProfitQuery(
    { from: today.subtract(6, 'day').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') },
    { skip: !isFeatureEnabled('dailyProfit') || user?.role.code !== 'pencuci' },
  );
  const profitHidden = (profit.error as { status?: number } | undefined)?.status === 403;

  const e = earnings.data;
  const b = balance.data;
  const paidByMandor = b?.paid_by.code === 'mandor';
  const refresh = () => {
    earnings.refetch();
    balance.refetch();
    if (!profitHidden) profit.refetch();
  };

  return (
    <Screen
      title="Pendapatan"
      refreshing={(earnings.isFetching || balance.isFetching) && !earnings.isLoading}
      onRefresh={refresh}
      footer={
        isFeatureEnabled('withdrawals') ? (
          <BottomBar inTabs>
            <Button
              title="Tarik dana"
              icon="dollar-sign"
              onPress={() => router.push('/tarik-dana')}
              style={styles.flex}
            />
          </BottomBar>
        ) : undefined
      }>
      <View style={styles.weekPicker}>
        <IconButton
          icon="chevron-left"
          accessibilityLabel="Minggu sebelumnya"
          onPress={() => setWeek(w => shiftWeek(w, -1))}
        />
        <View style={styles.weekLabel}>
          <Text variant="bodyStrong" align="center">
            Minggu {weekNumber(week)}
            {week === currentWeek ? ' (minggu ini)' : ''}
          </Text>
          <Text variant="small" color="textSecondary" align="center">
            {e ? formatRange(e.from, e.to) : ' '}
          </Text>
        </View>
        <IconButton
          icon="chevron-right"
          accessibilityLabel="Minggu berikutnya"
          disabled={week >= currentWeek}
          onPress={() => setWeek(w => shiftWeek(w, 1))}
        />
      </View>

      {earnings.isLoading ? (
        <SkeletonList rows={4} />
      ) : earnings.error ? (
        <ErrorState error={toApiError(earnings.error)} onRetry={earnings.refetch} />
      ) : e ? (
        <>
          <Card style={styles.total}>
            <Text variant="small" color="textSecondary">
              Total {week === currentWeek ? 'minggu ini' : `minggu ${weekNumber(week)}`}
            </Text>
            <Amount value={e.total} unit="rupiah" size="xl" />
            <View style={styles.badges}>
              <Badge
                label={e.paid_by.label}
                tone={e.paid_by.code === 'sion' ? 'primary' : 'neutral'}
              />
              <Badge
                label={e.finished ? 'Minggu selesai' : 'Minggu berjalan'}
                tone={e.finished ? 'accent' : 'gold'}
              />
            </View>
            <Text variant="small" color="textSecondary">
              Hadir {e.present_days} hari, bahan {formatGram(e.material_gram)}
            </Text>
          </Card>

          <Section title="Rincian">
            <Card style={styles.tight}>
              <MoneyRow
                label="Upah sudah dihitung"
                amount={e.upah_by_status.sudah_dihitung}
                note="Masuk saldo"
              />
              <MoneyRow
                label="Upah belum dihitung"
                amount={e.upah_by_status.belum_dihitung}
                note="Perkiraan, menunggu Kalkulasi Upah"
              />
              <MoneyRow
                label="Upah tertahan"
                amount={e.upah_by_status.tertahan}
                note="Kartu belum QC, belum diverifikasi, atau hasil timbang belum dikonfirmasi"
              />
              <MoneyRow
                label="Gaji harian"
                amount={e.gaji_harian}
                note={`${e.present_days} hari hadir`}
              />
              <MoneyRow
                label="Bonus mingguan"
                amount={e.bonus_mingguan.amount}
                note={
                  <View style={styles.noteRow}>
                    <Badge status={e.bonus_mingguan.status} kind="bonus" />
                    {e.bonus_mingguan.target_gram ? (
                      <Text variant="small" color="textSecondary">
                        {formatGram(e.bonus_mingguan.achieved_gram)} /{' '}
                        {formatGram(e.bonus_mingguan.target_gram)}
                      </Text>
                    ) : null}
                  </View>
                }
              />
              <MoneyRow label="Total" amount={e.total} strong divider={false} />
            </Card>
          </Section>

          <Section title="Per hari" description="Ketuk hari untuk melihat kartu dan status upah.">
            <Card style={styles.tight}>
              {e.days.length === 0 ? (
                <Text variant="body" color="textSecondary" style={styles.pad}>
                  Belum ada hari kerja di minggu ini.
                </Text>
              ) : (
                e.days.map(d => <DayRow key={d.date} day={d} />)
              )}
            </Card>
          </Section>
        </>
      ) : null}

      {b && b.pending_items.length > 0 ? (
        <Section
          title="Bonus dan THR berjalan"
          description="Bertambah setiap hari hadir. Masuk Bonus Pending sampai capai.">
          <Card style={styles.tight}>
            {b.pending_items.map((it, i) => (
              <PendingRow key={`${it.kind}-${i}`} item={it} />
            ))}
          </Card>
        </Section>
      ) : null}

      {isFeatureEnabled('dailyProfit') &&
      !profitHidden &&
      profit.data &&
      profit.data.data.length > 0 ? (
        <Section
          title="Profit harian"
          description="Laba dari kartu yang hasil standarnya sudah diisi.">
          <Card style={styles.tight}>
            {profit.data.data.map(d => (
              <View key={d.date} style={styles.profitRow}>
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

      {b ? (
        <Section title="Saldo">
          <Card style={styles.tight}>
            {paidByMandor ? (
              <>
                <Text variant="small" color="textSecondary" style={styles.pad}>
                  {b.paid_by.label}. Penarikan diproses Mandor dari dana Mandor.
                </Text>
                {(b.mandor_funds ?? []).map((f, i) => (
                  <View key={i}>
                    <MoneyRow
                      label="Dapat dicairkan"
                      amount={f.dapat_dicairkan}
                      note={`Sumber dana: Mandor ${typeof f.mandor === 'string' ? f.mandor : f.mandor.name}`}
                    />
                    <MoneyRow
                      label="THR Ditahan"
                      amount={f.thr_ditahan}
                      note={`Mandor ${typeof f.mandor === 'string' ? f.mandor : f.mandor.name}`}
                    />
                  </View>
                ))}
              </>
            ) : (
              <MoneyRow
                label="Saldo Dapat Dicairkan"
                amount={b.dapat_dicairkan}
                note="Sumber dana: SION"
                strong
              />
            )}
            <MoneyRow label="Bonus Pending" amount={b.pending} note="Belum bisa dicairkan" />
            <MoneyRow
              label="THR Ditahan"
              amount={b.thr_ditahan}
              note="Dilepas pada tanggal THR tahunan"
              divider={false}
            />
          </Card>
        </Section>
      ) : balance.error ? (
        <ErrorState error={toApiError(balance.error)} onRetry={balance.refetch} />
      ) : null}

      <Text variant="small" color="textSecondary" align="center">
        Diperbarui {formatDate(today.format('YYYY-MM-DD'))}. Tarik layar ke bawah untuk menyegarkan.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  weekPicker: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  weekLabel: { flex: 1 },
  total: { gap: space.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  noteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center' },
  tight: { paddingVertical: space.xs },
  pad: { paddingVertical: space.md },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: sizes.primaryButton,
    paddingVertical: space.sm,
  },
  dayDetail: { paddingBottom: space.sm, paddingLeft: space.md },
  cardRow: { flexDirection: 'row', gap: space.md, paddingVertical: space.sm },
  tabular: { fontVariant: ['tabular-nums'], textAlign: 'right' },
  pending: { paddingVertical: space.md, gap: space.sm },
  pendingHead: { flexDirection: 'row', gap: space.md },
  right: { alignItems: 'flex-end' },
  profitRow: { flexDirection: 'row', gap: space.md, paddingVertical: space.md },
});

export default Earnings;
