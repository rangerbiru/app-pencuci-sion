import { StyleSheet, View } from 'react-native';
import { space, ThemeColors } from '@/theme';
import { formatGram, formatPcs, formatRupiah } from '@/utils/format';
import Text from '../Text';

export interface AmountProps {
  value: string | number | null | undefined;
  unit: 'rupiah' | 'gram' | 'pcs';
  size?: 'xl' | 'l' | 'm';
  color?: keyof ThemeColors;
  /** rupiah tanpa desimal (Beranda) */
  whole?: boolean;
}

/**
 * Angka besar tabular dengan satuan kecil. String dari API diformat apa adanya (tanpa float).
 */
function Amount({ value, unit, size = 'l', color = 'text', whole }: AmountProps) {
  const variant = size === 'xl' ? 'numberXL' : size === 'l' ? 'numberL' : 'numberM';
  let num: string;
  let prefix: string | null = null;
  let suffix: string | null = null;
  if (unit === 'rupiah') {
    const formatted = formatRupiah(value as string, { style: whole ? 'whole' : 'full' });
    if (formatted === '-') num = '-';
    else {
      const neg = formatted.startsWith('-');
      prefix = `${neg ? '-' : ''}Rp`;
      num = formatted.replace(/^-?Rp\s?/, '');
    }
  } else if (unit === 'gram') {
    num = formatGram(value as string, { unit: false });
    suffix = num === '-' ? null : 'gr';
  } else {
    num = formatPcs(value);
    suffix = num === '-' ? null : 'pcs';
  }
  const label = [prefix, num, suffix].filter(Boolean).join(' ');
  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      {prefix ? (
        <Text variant="smallStrong" color="textSecondary" style={styles.unit}>
          {prefix}
        </Text>
      ) : null}
      <Text variant={variant} color={color}>
        {num}
      </Text>
      {suffix ? (
        <Text variant="smallStrong" color="textSecondary" style={styles.unit}>
          {suffix}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: space.xs },
  unit: { marginBottom: 2 },
});

export default Amount;
