import { StyleSheet, View } from 'react-native';
import useOnFocus from '@/hooks/useOnFocus';
import { setStatusBarStyle } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '@/hooks/useTheme';
import { sizes, space } from '@/theme';
import Text from '@/components/elements/Text';
import OfflineBanner from '../OfflineBanner';
import PendingChip from '../PendingChip';
import Bell from './Bell';

export interface HomeHeaderProps {
  name: string;
  /** baris kecil: peran dan tim, mis. "Pencuci, tim Bu Sari" */
  subtitle?: string;
}

function initials(name: string) {
  const parts = name
    .replace(/^(Bu|Pak|Ibu|Bapak)\s+/i, '')
    .trim()
    .split(/\s+/);
  return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

/**
 * Header v2 untuk Beranda: di atas latar layar (bukan bilah navy), avatar inisial, "Hai, nama",
 * peran/tim kecil, lonceng. Bilah status gelap di mode terang selama layar ini fokus.
 */
function HomeHeader({ name, subtitle }: HomeHeaderProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  useOnFocus(
    () => setStatusBarStyle(isDark ? 'light' : 'dark'),
    () => setStatusBarStyle('light'),
  );

  return (
    <View style={{ backgroundColor: colors.background }}>
      <View style={[styles.root, { paddingTop: insets.top + space.md }]}>
        <View
          style={[styles.avatar, { backgroundColor: colors.header }]}
          accessible
          accessibilityLabel={`Akun ${name}`}>
          <Text type="bodyStrong" style={{ color: colors.accent }} maxFontSizeMultiplier={1}>
            {initials(name)}
          </Text>
        </View>
        <View style={styles.titles}>
          <Text type="name" numberOfLines={1} accessibilityRole="header">
            Hai, {name}
          </Text>
          {subtitle ? (
            <Text type="small" color="textSecondary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <PendingChip />
        <Bell />
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
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: { flex: 1, minWidth: 0 },
});

export default HomeHeader;
