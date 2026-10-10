import { StyleSheet, View } from 'react-native';
import useOnFocus from '@/hooks/useOnFocus';
import { setStatusBarStyle } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '@/hooks/useTheme';
import useNow from '@/hooks/useNow';
import { formatDayLong, greeting } from '@/utils/date';
import { sizes, space } from '@/theme';
import Text from '@/components/elements/Text';
import OfflineBanner from '../OfflineBanner';
import PendingChip from '../PendingChip';
import Bell from './Bell';

export interface HomeHeaderProps {
  name: string;
  /** peran dan tim, mis. "Pencuci, tim Bu Sari"; tampil bersama tanggal di baris bawah */
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
 * Header v2 untuk Beranda: di atas latar layar (bukan bilah navy), avatar inisial kecil, sapaan
 * kecil redup (13), nama 17 semibold, lalu tanggal dan peran/tim (13), lonceng di kanan.
 * Bilah status gelap di mode terang selama layar ini fokus.
 */
function HomeHeader({ name, subtitle }: HomeHeaderProps) {
  const { colors, isDark } = useTheme();
  const now = useNow(60000);
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
          <Text type="small" color="textSecondary" numberOfLines={1}>
            {greeting(now)},
          </Text>
          <Text type="name" numberOfLines={1} accessibilityRole="header">
            {name}
          </Text>
          <Text type="small" color="textSecondary" numberOfLines={2}>
            {formatDayLong(now.format('YYYY-MM-DD'))}
            {subtitle ? `. ${subtitle}` : ''}
          </Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: { flex: 1, minWidth: 0 },
});

export default HomeHeader;
