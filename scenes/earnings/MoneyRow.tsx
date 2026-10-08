import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { space } from '@/theme';
import { formatRupiah } from '@/utils/format';
import Text from '@/components/elements/Text';

export interface MoneyRowProps {
  label: string;
  /** string uang dari API, ditampilkan apa adanya lewat formatRupiah */
  amount: string | null | undefined;
  note?: ReactNode;
  strong?: boolean;
  divider?: boolean;
}

/** Baris slip gaji: label kiri, rupiah rata kanan (angka tabular). */
function MoneyRow({ label, amount, note, strong, divider = true }: MoneyRowProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.row, divider && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={styles.left}>
        <Text variant={strong ? 'bodyStrong' : 'body'}>{label}</Text>
        {typeof note === 'string' ? (
          <Text variant="small" color="textSecondary">
            {note}
          </Text>
        ) : (
          note
        )}
      </View>
      <Text
        variant={strong ? 'numberM' : 'bodyStrong'}
        style={styles.amount}
        testID={`money-${label}`}>
        {formatRupiah(amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.md },
  left: { flex: 1, gap: space.xxs },
  amount: { fontVariant: ['tabular-nums'], textAlign: 'right' },
});

export default MoneyRow;
