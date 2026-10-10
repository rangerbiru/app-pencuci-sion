import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '@/hooks/useTheme';
import useOnFocus from '@/hooks/useOnFocus';
import { sizes, space } from '@/theme';
import Text from '@/components/elements/Text';
import Icon from '@/components/elements/Icon';
import { PressableScale } from '@/components/elements/Motion';
import OfflineBanner from '../OfflineBanner';
import PendingChip from '../PendingChip';
import Bell from './Bell';

/** Header halaman v2 di latar terang: tombol kembali (opsional), judul 18, lonceng. */
function PageHeader({
  title,
  subtitle,
  back,
  bell = true,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  bell?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  useOnFocus(
    () => setStatusBarStyle(isDark ? 'light' : 'dark'),
    () => setStatusBarStyle('light'),
  );
  return (
    <View style={{ backgroundColor: colors.background }}>
      <View style={[styles.root, { paddingTop: insets.top + space.md }]}>
        {back ? (
          <PressableScale
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityLabel="Kembali"
            haptic={false}
            style={[styles.back, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Icon name="arrow-left" size={20} color={colors.text} />
          </PressableScale>
        ) : null}
        <View style={styles.titles}>
          <Text type="screenTitle" accessibilityRole="header" numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text type="small" color="textSecondary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <PendingChip />
        {bell ? <Bell /> : null}
      </View>
      <OfflineBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: sizes.gutter,
    paddingBottom: space.sm,
    minHeight: 56,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: { flex: 1, minWidth: 0 },
});

export default PageHeader;
