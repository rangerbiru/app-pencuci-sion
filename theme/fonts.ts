import { loadAsync } from 'expo-font';
import {
  GoogleSansFlex_400Regular,
  GoogleSansFlex_500Medium,
  GoogleSansFlex_600SemiBold,
  GoogleSansFlex_700Bold,
} from '@expo-google-fonts/google-sans-flex';

/**
 * Google Sans Flex (OFL) seperti web. Bila gagal dimuat, Text jatuh ke huruf sistem.
 */
export const fonts = {
  regular: 'GoogleSansFlex_400Regular',
  medium: 'GoogleSansFlex_500Medium',
  semiBold: 'GoogleSansFlex_600SemiBold',
  bold: 'GoogleSansFlex_700Bold',
} as const;

export type FontWeightName = keyof typeof fonts;

export const loadFonts = () =>
  loadAsync({
    [fonts.regular]: GoogleSansFlex_400Regular,
    [fonts.medium]: GoogleSansFlex_500Medium,
    [fonts.semiBold]: GoogleSansFlex_600SemiBold,
    [fonts.bold]: GoogleSansFlex_700Bold,
  });
