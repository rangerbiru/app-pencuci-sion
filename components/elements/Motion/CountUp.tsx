import { useEffect, useState } from 'react';
import { Platform, StyleProp, StyleSheet, TextInput, TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import useTheme from '@/hooks/useTheme';
import { duration, type2, Type2Variant } from '@/theme';
import { toCents } from '@/utils/decimal';
import { NBSP } from '@/utils/format';
import Text from '../Text';

Animated.addWhitelistedNativeProps({ text: true });
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

/** "1234567" -> "1.234.567" di worklet (UI thread). */
function groupWorklet(n: number): string {
  'worklet';
  const s = Math.round(Math.abs(n)).toString();
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += '.';
    out += s[i];
  }
  return (n < 0 ? '-' : '') + out;
}

export interface CountUpProps {
  /** string desimal dari API, mis. "3747500.00" */
  value: string | null | undefined;
  /** teks akhir yang tepat (sudah diformat), dipakai setelah animasi selesai */
  formatted: string;
  type?: Type2Variant;
  style?: StyleProp<TextStyle>;
  /** awalan dalam angka yang menghitung, mis. "Rp " */
  prefix?: string;
}

/**
 * Angka yang menghitung naik sekitar 600 ms saat pertama tampil (worklet di UI thread lewat
 * prop `text` TextInput). Teks akhir selalu `formatted` (string API diformat tanpa float).
 * Pratinjau web dan "kurangi gerak": langsung teks akhir.
 */
/** Pratinjau web: prop `text` TextInput tidak dianimasikan Reanimated, jadi dihitung di JS. */
function WebCountUp({ value, formatted, type = 'numberXL', style, prefix = '' }: CountUpProps) {
  const reduce = useReducedMotion();
  const target = Number(toCents(value ?? null) ?? 0n) / 100;
  const [shown, setShown] = useState<string | null>(reduce ? null : `${prefix}0`);
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration.countUp);
      const eased = 1 - Math.pow(1 - p, 3);
      if (p >= 1) {
        setShown(null);
        return;
      }
      setShown(prefix + groupWorklet(target * eased));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, target, prefix]);
  return (
    <Text type={type} style={style} accessibilityLabel={formatted}>
      {shown ?? formatted}
    </Text>
  );
}

function CountUp(props: CountUpProps) {
  return Platform.OS === 'web' ? <WebCountUp {...props} /> : <NativeCountUp {...props} />;
}

function NativeCountUp({ value, formatted, type = 'numberXL', style, prefix = '' }: CountUpProps) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const animate = !reduce;
  const target = Number(toCents(value ?? null) ?? 0n) / 100;
  const progress = useSharedValue(0);
  const [done, setDone] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    progress.set(0);
    setDone(false);
    progress.set(withTiming(1, { duration: duration.countUp, easing: Easing.out(Easing.cubic) }));
    // setelah animasi: ganti ke Text biasa berisi teks akhir yang tepat
    const t = setTimeout(() => setDone(true), duration.countUp + 30);
    return () => clearTimeout(t);
  }, [animate, target, progress]);

  const animatedProps = useAnimatedProps(() => {
    const text = prefix + groupWorklet(target * progress.get());
    return { text, defaultValue: text } as unknown as Record<string, unknown>;
  });

  const textStyle = [type2[type], { color: colors.text }, style];
  if (done) {
    return (
      <Text type={type} style={style} accessibilityLabel={formatted}>
        {formatted}
      </Text>
    );
  }
  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      accessibilityLabel={formatted}
      animatedProps={animatedProps}
      style={[styles.input, textStyle]}
      defaultValue={`${prefix}0`}
    />
  );
}

/** Jarak tak terputus antara "Rp" dan angka, untuk prefix CountUp. */
export const RP_PREFIX = `Rp${NBSP}`;

const styles = StyleSheet.create({
  input: { padding: 0, margin: 0, borderWidth: 0, includeFontPadding: false },
});

export default CountUp;
