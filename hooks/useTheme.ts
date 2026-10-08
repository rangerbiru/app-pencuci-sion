import { darkColors, lightColors, badgeColors } from '@/theme/colors';
import useColorScheme from './useColorScheme';

/** Warna aktif: terang bawaan, gelap mengikuti sistem. */
export default function useTheme() {
  const { isDark } = useColorScheme();
  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
    badges: isDark ? badgeColors.dark : badgeColors.light,
  };
}
