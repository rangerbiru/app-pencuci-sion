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

/**
 * Skala huruf v2 (Tahap 14C-R2): isi 15, kecil/label 13, judul layar 18, judul kartu 16,
 * angka besar 24 s.d. 28, tinggi baris sekitar 1,4x. Dipakai layar v2; layar lama tetap `typography`.
 */
export const type2 = {
  screenTitle: { fontFamily: fonts.semiBold, fontSize: 18, lineHeight: 25 },
  name: { fontFamily: fonts.semiBold, fontSize: 17, lineHeight: 23 },
  cardTitle: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  number: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
  numberL: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    lineHeight: 30,
    fontVariant: ['tabular-nums'],
  },
  numberXL: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
  },
  clock: {
    fontFamily: fonts.semiBold,
    fontSize: 40,
    lineHeight: 46,
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<string, TextStyle>;

export type Type2Variant = keyof typeof type2;

/** Batas pembesaran huruf sistem supaya tata letak tidak rusak. */
export const MAX_FONT_SCALE = 1.3;
