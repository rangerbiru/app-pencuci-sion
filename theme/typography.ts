import { TextStyle } from 'react-native';
import tokens from './tokens.json';
import { fonts } from './fonts';

const fs = tokens.fontSize;

/**
 * Skala huruf mobile. Dasar dari tokens.json; isi 16 (web 14) karena dibaca sambil bekerja.
 * Angka memakai tabular-nums supaya kolom gram dan rupiah rata.
 */
export const typography = {
  display: { fontFamily: fonts.bold, fontSize: fs['3xl'].size, lineHeight: fs['3xl'].lineHeight },
  title: { fontFamily: fonts.bold, fontSize: fs['2xl'].size, lineHeight: fs['2xl'].lineHeight },
  heading: { fontFamily: fonts.medium, fontSize: fs.xl.size, lineHeight: fs.xl.lineHeight },
  subheading: { fontFamily: fonts.medium, fontSize: fs.lg.size, lineHeight: fs.lg.lineHeight },
  body: { fontFamily: fonts.regular, fontSize: fs.base.size, lineHeight: fs.base.lineHeight },
  bodyStrong: { fontFamily: fonts.medium, fontSize: fs.base.size, lineHeight: fs.base.lineHeight },
  small: { fontFamily: fonts.regular, fontSize: fs.sm.size, lineHeight: fs.sm.lineHeight },
  smallStrong: { fontFamily: fonts.medium, fontSize: fs.sm.size, lineHeight: fs.sm.lineHeight },
  caption: {
    fontFamily: fonts.medium,
    fontSize: fs.xs.size,
    lineHeight: fs['theme-xs'].lineHeight,
  },
  button: { fontFamily: fonts.medium, fontSize: fs.base.size, lineHeight: fs.base.lineHeight },
  numberXL: {
    fontFamily: fonts.semiBold,
    fontSize: fs['title-sm'].size,
    lineHeight: fs['title-sm'].lineHeight,
    fontVariant: ['tabular-nums'],
  },
  numberL: {
    fontFamily: fonts.semiBold,
    fontSize: fs['2xl'].size,
    lineHeight: fs['2xl'].lineHeight,
    fontVariant: ['tabular-nums'],
  },
  numberM: {
    fontFamily: fonts.semiBold,
    fontSize: fs.lg.size,
    lineHeight: fs.lg.lineHeight,
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
