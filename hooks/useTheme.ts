import { useContext, useSyncExternalStore } from 'react';
import { ReactReduxContext } from 'react-redux';
import { darkColors, lightColors, badgeColors } from '@/theme/colors';
import type { ThemePreference } from '@/slices/app.slice';
import useColorScheme from './useColorScheme';

const noopSubscribe = () => () => undefined;

/** Pilihan tampilan dari Redux; di luar Provider (mis. test komponen) = terang. */
export function useThemePreference(): ThemePreference {
  const ctx = useContext(ReactReduxContext);
  const store = ctx?.store;
  return useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    () =>
      (store?.getState() as { app?: { themePreference?: ThemePreference } } | undefined)?.app
        ?.themePreference ?? 'light',
  );
}

/** Warna aktif: pilihan pengguna (bawaan terang), atau mengikuti sistem bila dipilih. */
export default function useTheme() {
  const preference = useThemePreference();
  const { isDark: systemDark } = useColorScheme();
  const isDark = preference === 'dark' || (preference === 'system' && systemDark);
  return {
    isDark,
    preference,
    colors: isDark ? darkColors : lightColors,
    badges: isDark ? badgeColors.dark : badgeColors.light,
  };
}
