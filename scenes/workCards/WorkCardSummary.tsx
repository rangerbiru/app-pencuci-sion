import { StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { space } from '@/theme';
import { WorkCard } from '@/types';
import { formatDate, formatDateTime } from '@/utils/date';
import { formatGram, formatPcs, formatRupiah } from '@/utils/format';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Card from '@/components/elements/Card';

const GROUP_LABEL: Record<string, string> = {
  utuh: 'Utuh',
  kecil: 'Kecil',
  hancur: 'Hancur',
  kotor: 'Kotor',
};

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pair}>
      <Text variant="small" color="textSecondary">
        {label}
      </Text>
      <Text variant="bodyStrong" style={styles.tabular}>
        {value}
      </Text>
    </View>
  );
}

/** Ringkasan kartu kerja: bahan, hasil per grup, QC, konfirmasi timbang, verifikasi, upah. */
function WorkCardSummary({ card, showWorker }: { card: WorkCard; showWorker?: boolean }) {
  const { colors } = useTheme();
  const wc = card.weighing_confirmation;
  return (
    <Card style={styles.root}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Text variant="subheading">
            {showWorker ? card.worker.name : `Kartu ${formatDate(card.work_date)}`}
          </Text>
          <Text variant="small" color="textSecondary">
            {showWorker ? formatDate(card.work_date) : (card.location ?? '')}
          </Text>
        </View>
      </View>
      <View style={styles.badges}>
        <Badge status={card.status} kind="daily_work" />
        {card.qc_status ? (
          <Badge status={card.qc_status} kind="qc" prefix="QC" />
        ) : (
          <Badge label="Belum QC" tone="gold" />
        )}
        {wc ? (
          <Badge
            status={wc.status}
            kind="weighing_confirmation"
            icon="clipboard"
            prefix="Timbang"
          />
        ) : null}
        {card.wage ? (
          <Badge status={card.wage.status} kind="card_wage" icon="credit-card" prefix="Upah" />
        ) : null}
      </View>

      <View style={[styles.grid, { borderColor: colors.border }]}>
        <Pair label="Bahan" value={formatGram(card.material.gram)} />
        <Pair label="Pcs bahan" value={formatPcs(card.material.pcs)} />
        <Pair label="Pcs lembab" value={formatPcs(card.pcs_lembab)} />
        <Pair label="Hasil bersih" value={formatGram(card.result.gram)} />
      </View>

      {card.result.groups.length > 0 ? (
        <View style={styles.badges}>
          {card.result.groups.map(g => (
            <Text key={g.group} variant="small" color="textSecondary">
              {GROUP_LABEL[g.group] ?? g.group}:{' '}
              <Text variant="smallStrong">{formatGram(g.gram)}</Text>
            </Text>
          ))}
        </View>
      ) : null}

      {card.rework_date ? (
        <Text variant="small" color="danger">
          Kerja ulang tanggal {formatDate(card.rework_date)}
        </Text>
      ) : null}
      {wc?.reason ? (
        <Text variant="small" color="textSecondary">
          Alasan tidak setuju: {wc.reason}
        </Text>
      ) : null}
      {card.verified ? (
        <Text variant="small" color="textSecondary">
          Terverifikasi {formatDateTime(card.verified_at)}
        </Text>
      ) : null}
      {card.wage ? (
        <View style={styles.wage}>
          <Text variant="small" color="textSecondary">
            Upah kartu ini
          </Text>
          <Text variant="numberM">
            {card.wage.amount === null ? '-' : formatRupiah(card.wage.amount)}
          </Text>
          {card.wage.reason ? (
            <Text variant="small" color="textSecondary">
              {card.wage.reason}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  head: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, columnGap: space.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    paddingTop: space.md,
    rowGap: space.md,
  },
  pair: { width: '50%', gap: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
  wage: { gap: 2 },
});

export default WorkCardSummary;
