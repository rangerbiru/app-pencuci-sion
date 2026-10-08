import { Pressable, StyleSheet } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { radius, sizes } from '@/theme';
import Icon, { IconName } from '../Icon';

export interface IconButtonProps {
  icon: IconName;
  /** wajib: ikon tanpa teks harus punya label untuk pembaca layar */
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
}

/** Tombol ikon 48 x 48 dp dengan garis, untuk navigasi kecil (minggu, tanggal). */
function IconButton({ icon, accessibilityLabel, onPress, disabled }: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.root,
        {
          borderColor: colors.borderStrong,
          backgroundColor: pressed ? colors.surfaceSunken : colors.surface,
          opacity: disabled ? 0.4 : 1,
        },
      ]}>
      <Icon name={icon} size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: sizes.touch,
    height: sizes.touch,
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IconButton;
