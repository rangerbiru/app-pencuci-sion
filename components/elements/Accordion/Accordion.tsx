import { ReactNode, useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import useTheme from '@/hooks/useTheme';
import { duration, easing, sizes, space } from '@/theme';
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

export interface AccordionItemProps {
  open: boolean;
  onToggle: () => void;
  /** isi kepala baris (judul, badge); chevron ditambahkan otomatis */
  header: ReactNode;
  accessibilityLabel: string;
  children: ReactNode;
  divider?: boolean;
  /** padding tepi isi; false untuk isi yang mengatur jaraknya sendiri */
  padded?: boolean;
}

/**
 * Satu-satunya accordion di aplikasi (v2, Reanimated): tinggi isi diukur lalu dianimasikan
 * 220 ms ease-out, isi memudar masuk, chevron berputar. Isi baru dipasang saat pertama dibuka
 * lalu tetap terpasang (buka ulang tidak mengukur dari nol). "Kurangi gerak": langsung buka/tutup.
 * Dipakai di dalam kartu tanpa padding; efek tekan menutup seluruh lebar baris.
 */
export function AccordionItem({
  open,
  onToggle,
  header,
  accessibilityLabel,
  children,
  divider = true,
  padded = true,
}: AccordionItemProps) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const contentHeight = useSharedValue(0);
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    if (open) setMounted(true);
    const to = open ? 1 : 0;
    progress.set(
      reduce ? to : withTiming(to, { duration: duration.accordion, easing: easing.out }),
    );
  }, [open, reduce, progress]);

  // isi bisa berubah tinggi saat terbuka (mis. kartu konfirmasi timbang): ikut diperbarui
  const onContentLayout = (e: LayoutChangeEvent) => {
    contentHeight.set(Math.ceil(e.nativeEvent.layout.height));
  };

  const bodyStyle = useAnimatedStyle(() => ({
    height: contentHeight.get() * progress.get(),
    opacity: interpolate(progress.get(), [0, 0.4, 1], [0, 0.2, 1]),
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${180 * progress.get()}deg` }],
  }));

  return (
    <View>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={open ? 'Ketuk untuk menutup' : 'Ketuk untuk membuka rincian'}
        style={({ pressed }) => [styles.head, pressed && { backgroundColor: colors.pressed }]}>
        <View style={styles.headContent}>{header}</View>
        <Animated.View style={chevronStyle}>
          <Icon name="chevron-down" size={20} color={colors.textSecondary} />
        </Animated.View>
      </Pressable>
      {mounted ? (
        <Animated.View
          style={[styles.clip, bodyStyle]}
          accessibilityElementsHidden={!open}
          aria-hidden={!open}
          importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
          pointerEvents={open ? 'auto' : 'none'}>
          {/* diukur di posisi absolut supaya tingginya tidak ikut terpotong animasi */}
          <View style={styles.measure} onLayout={onContentLayout}>
            <View style={padded ? styles.body : undefined}>{children}</View>
          </View>
        </Animated.View>
      ) : null}
      {divider ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
    </View>
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
  clip: { overflow: 'hidden' },
  measure: { position: 'absolute', top: 0, left: 0, right: 0 },
  body: { paddingHorizontal: sizes.gutter, paddingBottom: space.md },
  divider: { height: 1, marginHorizontal: sizes.gutter },
});
