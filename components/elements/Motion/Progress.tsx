import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import useTheme from '@/hooks/useTheme';
import { duration, easing } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function useFill(value: number, delayMs = 0) {
  const reduce = useReducedMotion();
  const v = Math.max(0, Math.min(1, value));
  const fill = useSharedValue(reduce ? v : 0);
  useEffect(() => {
    fill.set(
      reduce
        ? v
        : withDelay(delayMs, withTiming(v, { duration: duration.progress, easing: easing.out })),
    );
  }, [v, reduce, delayMs, fill]);
  return fill;
}

export interface RingProps {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  accessibilityLabel: string;
}

/** Cincin progres SVG yang terisi dari 0 saat tampil (strokeDashoffset di UI thread). */
export function ProgressRing({
  value,
  size = 96,
  stroke = 10,
  color,
  trackColor,
  children,
  accessibilityLabel,
}: RingProps) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const fill = useFill(value);
  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - fill.get()) }));
  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(Math.min(1, value) * 100) }}>
      <Svg width={size} height={size} style={styles.rotate}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor ?? colors.border}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? colors.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          animatedProps={props}
          fill="none"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

export interface BarProps {
  value: number;
  color?: string;
  trackColor?: string;
  height?: number;
  accessibilityLabel: string;
  delayMs?: number;
}

/** Bilah progres yang terisi dari 0 (transform scaleX, bukan lebar: GPU). */
export function ProgressBarV2({
  value,
  color,
  trackColor,
  height = 8,
  accessibilityLabel,
  delayMs = 0,
}: BarProps) {
  const { colors } = useTheme();
  const fill = useFill(value, delayMs);
  const anim = useAnimatedStyle(() => ({ transform: [{ scaleX: Math.max(0.0001, fill.get()) }] }));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(Math.min(1, value) * 100) }}
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor ?? colors.border },
      ]}>
      <Animated.View
        style={[
          styles.fill,
          { borderRadius: height / 2, backgroundColor: color ?? colors.accent },
          anim,
        ]}
      />
    </View>
  );
}

export interface DonutSlice {
  key: string;
  value: number;
  color: string;
  label: string;
}

/** Donat hasil per kategori. Semua irisan terbuka bersama dari 0 (satu nilai bersama). */
export function Donut({
  slices,
  size = 132,
  stroke = 18,
  children,
  accessibilityLabel,
}: {
  slices: DonutSlice[];
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((n, s) => n + s.value, 0);
  const fill = useFill(total > 0 ? 1 : 0);
  let offset = 0;
  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel={accessibilityLabel}>
      <Svg width={size} height={size} style={styles.rotate}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.border}
          strokeWidth={stroke}
          fill="none"
        />
        {slices.map(s => {
          const len = total > 0 ? (s.value / total) * c : 0;
          const start = offset;
          offset += len;
          return (
            <DonutArc
              key={s.key}
              c={c}
              r={r}
              size={size}
              stroke={stroke}
              len={len}
              start={start}
              color={s.color}
              fill={fill}
            />
          );
        })}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

function DonutArc({
  c,
  r,
  size,
  stroke,
  len,
  start,
  color,
  fill,
}: {
  c: number;
  r: number;
  size: number;
  stroke: number;
  len: number;
  start: number;
  color: string;
  fill: ReturnType<typeof useSharedValue<number>>;
}) {
  // celah 2 px antar irisan supaya batas kategori terbaca
  const gap = len > 4 ? 2 : 0;
  const props = useAnimatedProps(() => {
    const shown = Math.max(0, len * fill.get() - gap);
    return { strokeDasharray: `${shown} ${c}`, strokeDashoffset: -start * fill.get() };
  });
  return (
    <AnimatedCircle
      cx={size / 2}
      cy={size / 2}
      r={r}
      stroke={color}
      strokeWidth={stroke}
      fill="none"
      animatedProps={props}
    />
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  // mulai dari jam 12
  rotate: { transform: [{ rotate: '-90deg' }] },
  track: { width: '100%', overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFillObject, transformOrigin: 'left' },
});
