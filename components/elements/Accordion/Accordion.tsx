import { ReactNode, useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import useTheme from '@/hooks/useTheme';
import { sizes, space } from '@/theme';
import Icon from '../Icon';

/**
 * Hanya satu bagian yang terbuka. Membuka bagian lain menutup yang sebelumnya;
 * mengetuk bagian yang terbuka menutupnya.
 */
export function useSingleOpen(initial: string | null = null) {
  const [openKey, setOpenKey] = useState<string | null>(initial);
  const toggle = useCallback((key: string) => setOpenKey(k => (k === key ? null : key)), []);
  return { openKey, setOpenKey, toggle };
}

// singkat dan mengikuti pengaturan "kurangi gerak" di HP (ReduceMotion.System)
const layout = LinearTransition.duration(180).reduceMotion(ReduceMotion.System);
const enter = FadeIn.duration(160).reduceMotion(ReduceMotion.System);
const exit = FadeOut.duration(100).reduceMotion(ReduceMotion.System);

export interface AccordionItemProps {
  open: boolean;
  onToggle: () => void;
  /** isi kepala baris (judul, badge); chevron ditambahkan otomatis */
  header: ReactNode;
  accessibilityLabel: string;
  children: ReactNode;
  divider?: boolean;
}

/**
 * Satu baris accordion di dalam kartu tanpa padding (Card padded={false}).
 * Efek tekan menutup seluruh lebar baris dan terpotong sudut kartu.
 */
export function AccordionItem({
  open,
  onToggle,
  header,
  accessibilityLabel,
  children,
  divider = true,
}: AccordionItemProps) {
  const { colors } = useTheme();
  return (
    <Animated.View layout={layout}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={open ? 'Ketuk untuk menutup' : 'Ketuk untuk membuka rincian'}
        style={({ pressed }) => [styles.head, pressed && { backgroundColor: colors.pressed }]}>
        <View style={styles.headContent}>{header}</View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
      </Pressable>
      {open ? (
        <Animated.View entering={enter} exiting={exit} style={styles.body}>
          {children}
        </Animated.View>
      ) : null}
      {divider ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: sizes.primaryButton,
    paddingVertical: space.sm,
    paddingHorizontal: sizes.gutter,
  },
  headContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  body: { paddingHorizontal: sizes.gutter, paddingBottom: space.md },
  divider: { height: 1, marginHorizontal: sizes.gutter },
});
