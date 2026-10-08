import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataPersistKeys } from '@/hooks/useDataPersist';
import type { ThemePreference } from '@/slices/app.slice';

const THEMES: ThemePreference[] = ['light', 'dark', 'system'];

/** Pilihan tampilan tersimpan; bawaan 'light'. Gagal membaca = bawaan. */
export async function loadThemePreference(): Promise<ThemePreference> {
  try {
    const raw = await AsyncStorage.getItem(DataPersistKeys.THEME_PREFERENCE);
    const value = raw ? (JSON.parse(raw) as unknown) : null;
    return THEMES.includes(value as ThemePreference) ? (value as ThemePreference) : 'light';
  } catch {
    return 'light';
  }
}

export async function saveThemePreference(value: ThemePreference): Promise<void> {
  try {
    await AsyncStorage.setItem(DataPersistKeys.THEME_PREFERENCE, JSON.stringify(value));
  } catch {
    // tidak tersimpan: tetap berlaku sampai aplikasi ditutup
  }
}
