import { Pressable, StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { radius, sizes, space } from '@/theme';
import Text from '../Text';

export interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/** Pilihan 2 s.d. 4 opsi, tiap opsi target sentuh 48 dp. */
function Segmented<T extends string>({
  value,
  options,
  onChange,
  accessibilityLabel,
}: SegmentedProps<T>) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.root, { borderColor: colors.borderStrong, backgroundColor: colors.surface }]}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.option, active && { backgroundColor: colors.header }]}>
            <Text
              variant="smallStrong"
              align="center"
              style={{ color: active ? colors.onHeader : colors.text }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.button,
    padding: space.xs,
    gap: space.xs,
  },
  option: {
    flex: 1,
    minHeight: sizes.touch - space.sm,
    borderRadius: radius.button - 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
});

export default Segmented;
