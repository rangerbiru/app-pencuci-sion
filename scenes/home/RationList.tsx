import { StyleSheet, View } from 'react-native';
import { space } from '@/theme';
import { MyRation } from '@/types';
import { addDecimal } from '@/utils/decimal';
import { formatGram, progressRatio } from '@/utils/format';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import ProgressBar from '@/components/elements/ProgressBar';
import Amount from '@/components/elements/Amount';
import useTheme from '@/hooks/useTheme';

/** Jatah aktif: sisa gram besar, progres diambil / target. */
function RationList({ rations }: { rations: MyRation[] }) {
  const { colors } = useTheme();
  return (
    <View>
      {rations.map((r, i) => {
        const used = addDecimal(r.taken_gram, r.pending_gram);
        return (
          <View
            key={r.batch_assignment_id}
            style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.head}>
              <View style={styles.flex}>
                <Text variant="bodyStrong">{r.item}</Text>
                <Text variant="small" color="textSecondary">
                  Batch {r.batch_code}
                </Text>
              </View>
              <Badge status={r.status} kind="assignment" />
            </View>
            <View style={styles.head}>
              <Text variant="small" color="textSecondary">
                Sisa jatah
              </Text>
              <Amount value={r.remaining_gram} unit="gram" size="m" />
            </View>
            <ProgressBar
              value={progressRatio(used, r.target_gram)}
              label={`Sudah diambil ${formatGram(used)} dari ${formatGram(r.target_gram)}`}
            />
            <Text variant="small" color="textSecondary">
              Diambil {formatGram(r.taken_gram)}
              {r.pending_gram && r.pending_gram !== '0.00'
                ? `, menunggu ${formatGram(r.pending_gram)}`
                : ''}{' '}
              dari {formatGram(r.target_gram)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: space.md, gap: space.sm },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    justifyContent: 'space-between',
  },
  flex: { flex: 1 },
});

export default RationList;
