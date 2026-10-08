import { Pressable, StyleSheet } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { radius, sizes, space } from '@/theme';
import Text from '../Text';
import Icon, { IconName } from '../Icon';

export interface ChipProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  selected?: boolean;
  accessibilityLabel?: string;
}

/** Pilihan cepat berbentuk pil, mis. "Tarik semua". Area sentuh 44 dp. */
function Chip({ label, onPress, icon, selected, accessibilityLabel }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={4}
      style={({ pressed }) => [
        styles.root,
        {
          borderColor: selected ? colors.fieldFocus : colors.fieldBorder,
          backgroundColor: selected
            ? colors.navIndicator
            : pressed
              ? colors.pressed
              : colors.surface,
        },
      ]}>
      {icon ? (
        <Icon
          name={icon}
          size={16}
          color={selected ? colors.onNavIndicator : colors.textSecondary}
        />
      ) : null}
      <Text variant="smallStrong" style={{ color: selected ? colors.onNavIndicator : colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: sizes.touch - 8,
    paddingHorizontal: space.md,
    borderRadius: radius.badge,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'flex-start',
  },
});

export default Chip;
