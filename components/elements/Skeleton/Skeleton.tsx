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

const styles = StyleSheet.create({
  block: { overflow: 'hidden' },
  band: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  list: { gap: space.lg },
  row: { gap: space.sm },
});

export default Skeleton;
