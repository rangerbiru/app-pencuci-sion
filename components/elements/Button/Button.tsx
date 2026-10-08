import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import useTheme from '@/hooks/useTheme';
import { radius, sizes, space } from '@/theme';
import Text from '../Text';
import Icon, { IconName } from '../Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: ButtonVariant;
  icon?: IconName;
  isLoading?: boolean;
  /** tombol utama 56 dp; selain itu 48 dp */
  size?: 'large' | 'regular';
  style?: StyleProp<ViewStyle>;
}

/**
 * Tombol SION. Utama: emas dengan teks navy (sama dengan web). Tanpa panah di teks.
 */
function Button({
  title,
  variant = 'primary',
  icon,
  isLoading = false,
  size,
  disabled,
  style,
  ...others
}: ButtonProps) {
  const { colors } = useTheme();
  const height =
    (size ?? (variant === 'primary' ? 'large' : 'regular')) === 'large'
      ? sizes.primaryButton
      : sizes.button;
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
      border: colors.borderStrong,
    },
    danger: {
      bg: colors.surface,
      pressed: colors.dangerBg,
      fg: colors.danger,
      border: colors.danger,
    },
    ghost: {
      bg: 'transparent',
      pressed: colors.pressed,
      fg: colors.link,
      border: 'transparent',
    },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!inactive, busy: isLoading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.root,
        {
          minHeight: height,
          backgroundColor: pressed ? palette.pressed : palette.bg,
          borderColor: palette.border,
          opacity: disabled && !isLoading ? 0.5 : 1,
        },
        style,
      ]}
      {...others}>
      {isLoading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={20} color={palette.fg} /> : null}
          <Text variant="button" style={{ color: palette.fg }} numberOfLines={2} align="center">
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.button,
    borderWidth: 1,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});

export default Button;
