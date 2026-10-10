import { useEffect, useState } from 'react';
import { DimensionValue, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import useTheme from '@/hooks/useTheme';
import { radius, space } from '@/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
}

/** Balok muat dengan kilau halus yang bergeser; diam bila "Kurangi gerak" aktif. */
export function Skeleton({ width = '100%', height = 16, rounded = radius.button }: SkeletonProps) {
  const { colors, isDark } = useTheme();
  const reduce = useReducedMotion();
  const [w, setW] = useState(0);
  const x = useSharedValue(0);
  useEffect(() => {
    if (reduce || w === 0) return;
    x.set(0);
    x.set(withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }), -1));
    return () => cancelAnimation(x);
  }, [reduce, w, x]);
  const band = useAnimatedStyle(() => ({
    transform: [{ translateX: -w * 0.6 + x.get() * w * 1.6 }],
  }));
  return (
    <View
      onLayout={e => setW(e.nativeEvent.layout.width)}
      style={[
        styles.block,
        { width, height, borderRadius: rounded, backgroundColor: colors.skeleton },
      ]}>
      {!reduce && w > 0 ? (
        <Animated.View
          style={[
            styles.band,
            {
              width: w * 0.6,
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)',
            },
            band,
          ]}
        />
      ) : null}
    </View>
  );
}

/** Kerangka layar umum: beberapa baris dan satu kartu. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <View style={styles.list} accessibilityLabel="Memuat data" accessible>
      <Skeleton height={120} rounded={radius.card} />
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width="60%" height={18} />
          <Skeleton width="40%" height={14} />
        </View>
      ))}
    </View>
  );
}

export interface SkeletonRowsProps {
  rows?: number;
  /** gambar kecil 40 dp di kiri tiap baris (kartu pengajuan, notifikasi) */
  leading?: boolean;
}

/** Bentuk daftar: kartu berisi baris bergaris pemisah, sama seperti ListRow/SubmissionItem. */
export function SkeletonRows({ rows = 4, leading = false }: SkeletonRowsProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      accessibilityLabel="Memuat daftar"
      accessible>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.listRow,
            i < rows - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
          ]}>
          {leading ? <Skeleton width={40} height={40} rounded={radius.tile} /> : null}
          <View style={styles.flex}>
            <Skeleton width={i % 2 ? '55%' : '70%'} height={16} />
            <Skeleton width="40%" height={12} />
          </View>
          <Skeleton width={56} height={20} rounded={radius.pill} />
        </View>
      ))}
    </View>
  );
}

/** Bentuk Beranda/Pendapatan: kartu hero lalu ubin ringkasan. */
export function SkeletonHero({ tiles = 2 }: { tiles?: number }) {
  return (
    <View style={styles.list} accessibilityLabel="Memuat ringkasan" accessible>
      <Skeleton height={196} rounded={radius.hero} />
      {tiles > 0 ? (
        <View style={styles.tiles}>
          {Array.from({ length: tiles }).map((_, i) => (
            <View key={i} style={styles.flex}>
              <Skeleton height={88} rounded={radius.tile} />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Bentuk detail: judul + status, pasangan label/nilai, lalu foto 4:3. */
export function SkeletonDetail({ facts = 4, photo = true }: { facts?: number; photo?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.list} accessibilityLabel="Memuat detail" accessible>
      <View style={styles.row}>
        <Skeleton width="65%" height={22} />
        <Skeleton width={88} height={22} rounded={radius.pill} />
      </View>
      <View
        style={[
          styles.card,
          styles.facts,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        {Array.from({ length: facts }).map((_, i) => (
          <View key={i} style={styles.fact}>
            <Skeleton width="35%" height={14} />
            <Skeleton width="30%" height={14} />
          </View>
        ))}
      </View>
      {photo ? <Skeleton height={220} rounded={radius.table} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { overflow: 'hidden' },
  band: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  list: { gap: space.lg },
  row: { gap: space.sm },
  flex: { flex: 1, gap: space.xs },
  card: { borderRadius: radius.card, borderWidth: 1, overflow: 'hidden' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 64,
  },
  tiles: { flexDirection: 'row', gap: space.md },
  facts: { padding: space.lg, gap: space.md },
  fact: { flexDirection: 'row', justifyContent: 'space-between' },
});

export default Skeleton;
