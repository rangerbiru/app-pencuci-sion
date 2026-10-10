import { StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { radius, shadow, space } from '@/theme';
import Text from '../Text';
import Icon, { IconName } from '../Icon';
import PressableScale from './PressableScale';

/** Tombol aksi melayang (extended FAB) di zona jempol kanan bawah: aksi utama per peran. */
function Fab({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      style={[styles.root, shadow.hero, { backgroundColor: colors.accent }]}>
      <View style={styles.row}>
        <Icon name={icon} size={20} color={colors.onAccent} />
        <Text type="bodyStrong" style={{ color: colors.onAccent }} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 52,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});

export default Fab;
