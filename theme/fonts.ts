import { loadAsync } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

/**
 * Plus Jakarta Sans (OFL, Tokotype Jakarta), dipilih di Tahap 14C-R2 dari perbandingan dengan Inter dan
 * Google Sans Flex (docs/DESIGN_MOBILE.md): angka jelas, angka tabular paling ramping sehingga rupiah
 * panjang muat, karakter hangat dan lokal. Bila gagal dimuat, Text jatuh ke huruf sistem.
 */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

export type FontWeightName = keyof typeof fonts;

export const loadFonts = () =>
  loadAsync({
    [fonts.regular]: PlusJakartaSans_400Regular,
    [fonts.medium]: PlusJakartaSans_500Medium,
    [fonts.semiBold]: PlusJakartaSans_600SemiBold,
    [fonts.bold]: PlusJakartaSans_700Bold,
  });
