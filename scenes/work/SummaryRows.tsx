import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { space } from '@/theme';
import Text from '@/components/elements/Text';

/** Baris "label: nilai" untuk layar ringkasan sebelum kirim. */
export function SummaryRow({
  label,
  children,
  last,
}: {
  label: string;
  children: ReactNode;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text variant="small" color="textSecondary">
        {label}
      </Text>
      {typeof children === 'string' ? <Text variant="bodyStrong">{children}</Text> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: space.md, gap: space.xxs },
});
