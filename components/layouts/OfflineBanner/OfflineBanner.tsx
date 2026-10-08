import { StyleSheet, View } from 'react-native';
import useOnline from '@/hooks/useOnline';
import useTheme from '@/hooks/useTheme';
import { sizes, space } from '@/theme';
import Text from '@/components/elements/Text';
import Icon from '@/components/elements/Icon';

/** Banner "Tidak ada sinyal" di bawah header. */
function OfflineBanner() {
  const online = useOnline();
  const { colors } = useTheme();
  if (online) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.root, { backgroundColor: colors.warningBg }]}>
      <Icon name="wifi-off" size={18} color={colors.warning} />
      <Text variant="smallStrong" style={[styles.text, { color: colors.warning }]}>
        Tidak ada sinyal. Absen dan setoran disimpan dulu, lalu dikirim otomatis.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: sizes.gutter,
    paddingVertical: space.sm,
  },
  text: { flex: 1 },
});

export default OfflineBanner;
