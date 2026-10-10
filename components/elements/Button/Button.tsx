import {
  ActivityIndicator,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { pressScale, radius, space, spring } from '@/theme';
import Text from '../Text';
import Icon, { IconName } from '../Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: ButtonVariant;
  icon?: IconName;
  isLoading?: boolean;
  /** lama: 'large' = tinggi tombol utama (48), 'regular' = sekunder (44). Bawaan menurut variant. */
  size?: 'large' | 'regular';
  /**
   * Lebar penuh: hanya untuk tombol utama yang menempel di bawah (BottomBar memberi `flex`).
   * Selain itu tombol selebar isinya.
   */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Tinggi tombol v2: utama 48 dp, sekunder 44 dp (target sentuh tetap 48 lewat hitSlop). */
export const BUTTON_HEIGHT = { primary: 48, secondary: 44 } as const;

/**
 * Satu komponen tombol untuk semua layar (v2): radius 12, teks 15 semibold kalimat biasa,
 * status tekan (skala 0,97 + warna + haptic ringan), nonaktif, dan memuat (spinner kecil di
 * dalam tombol, label tetap). Pressable + shared value (bukan Gesture) supaya tetap bekerja di
 * dalam Modal Android dan pembaca layar.
 */
function Button({
  title,
  variant = 'primary',
  icon,
  isLoading = false,
  size,
  fullWidth = false,
  disabled,
  style,
  onPress,
  onPressIn,
  onPressOut,
  ...others
}: ButtonProps) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const pressed = useSharedValue(0);
  const kind = (size ?? (variant === 'primary' ? 'large' : 'regular')) === 'large';
  const height = kind ? BUTTON_HEIGHT.primary : BUTTON_HEIGHT.secondary;
  const inactive = disabled || isLoading;

  const palette = {
    primary: {
      bg: colors.accent,
      pressed: colors.accentPressed,
      fg: colors.onAccent,
      border: colors.accent,
    },
    secondary: {
      bg: colors.surface,
      pressed: colors.pressed,
      fg: colors.text,
      border: colors.fieldBorder,
    },
    danger: {
      bg: colors.surface,
      pressed: colors.dangerBg,
      fg: colors.danger,
      border: colors.danger,
    },
    ghost: { bg: 'transparent', pressed: colors.pressed, fg: colors.link, border: 'transparent' },
  }[variant];

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: reduce ? 1 : 1 - (1 - pressScale) * pressed.get() }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!inactive, busy: isLoading }}
      disabled={inactive}
      hitSlop={height < 48 ? { top: 2, bottom: 2 } : undefined}
      onPressIn={e => {
        pressed.set(withSpring(1, spring.press));
        onPressIn?.(e);
      }}
      onPressOut={e => {
        pressed.set(withSpring(0, spring.press));
        onPressOut?.(e);
      }}
      onPress={e => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        }
        onPress?.(e);
      }}
      // tata letak (lebar, flex dari BottomBar) di luar; tampilan dan skala di dalam
      style={[{ alignSelf: fullWidth ? 'stretch' : 'flex-start' }, style]}
      {...others}>
      {({ pressed: isPressed }) => (
        <Animated.View
          style={[
            styles.root,
            {
              minHeight: height,
              backgroundColor: isPressed ? palette.pressed : palette.bg,
              borderColor: palette.border,
              opacity: disabled && !isLoading ? 0.45 : 1,
            },
            anim,
          ]}>
          <View style={styles.content}>
            {isLoading ? (
              <ActivityIndicator size="small" color={palette.fg} />
            ) : icon ? (
              <Icon name={icon} size={18} color={palette.fg} />
            ) : null}
            <Text type="bodyStrong" style={{ color: palette.fg }} numberOfLines={2} align="center">
              {title}
            </Text>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.button,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    paddingVertical: space.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
});

export default Button;
