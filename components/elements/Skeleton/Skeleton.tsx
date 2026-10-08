import { useEffect } from 'react';
import { DimensionValue, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import useTheme from '@/hooks/useTheme';
import { radius, space } from '@/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
}

/** Balok muat. Berdenyut pelan; diam bila "Kurangi gerak" aktif. */
export function Skeleton({ width = '100%', height = 16, rounded = radius.button }: SkeletonProps) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (!reduce) opacity.value = withRepeat(withTiming(0.5, { duration: 800 }), -1, true);
  }, [reduce, opacity]);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius: rounded, backgroundColor: colors.skeleton }, anim]}
    />
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
  list: { gap: space.lg },
  row: { gap: space.sm },
});

export default Skeleton;
