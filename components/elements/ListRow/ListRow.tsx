import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { sizes, space } from '@/theme';
import Text from '../Text';
import Icon from '../Icon';

export interface ListRowProps {
  title: string;
  subtitle?: string | null;
  /** isi kanan: nilai, badge */
  right?: ReactNode;
  /** isi di bawah judul, mis. badge-badge */
  below?: ReactNode;
  left?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  divider?: boolean;
}

/** Baris daftar 56+ dp. Chevron hanya bila baris bisa dibuka. */
function ListRow({
  title,
  subtitle,
  right,
  below,
  left,
  onPress,
  accessibilityLabel,
  divider = true,
}: ListRowProps) {
  const { colors } = useTheme();
  const content = (
    <View
      style={[styles.row, divider && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      {left}
      <View style={styles.main}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle ? (
          <Text variant="small" color="textSecondary">
            {subtitle}
          </Text>
        ) : null}
        {below}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
      {onPress ? <Icon name="chevron-right" size={20} color={colors.textSecondary} /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')}
      style={({ pressed }) => pressed && { backgroundColor: colors.surfaceSunken }}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.primaryButton,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  main: { flex: 1, gap: space.xxs },
  right: { alignItems: 'flex-end', maxWidth: '50%' },
});

export default ListRow;
