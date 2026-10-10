import { TextStyle } from 'react-native';
import { fonts } from './fonts';

/**
 * Skala huruf mobile v2: isi 15, kecil 13, judul layar 18, judul kartu 16, angka besar 24 s.d. 28.
 * Angka memakai tabular-nums supaya kolom gram dan rupiah rata.
 */
export const typography = {
  // skala v2 (Tahap 14C-R2): isi 15, kecil 13, judul layar 18, judul kartu 16, angka 24 s.d. 28,
  // tinggi baris sekitar 1,4x. Nama varian lama dipertahankan supaya semua layar ikut berubah.
  display: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34 },
  title: { fontFamily: fonts.semiBold, fontSize: 18, lineHeight: 25 },
  heading: { fontFamily: fonts.semiBold, fontSize: 17, lineHeight: 23 },
  subheading: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 21 },
  numberXL: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
  },
  numberL: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    lineHeight: 30,
    fontVariant: ['tabular-nums'],
  },
  numberM: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    lineHeight: 22,
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
    fontSize: 34,
    lineHeight: 40,
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<string, TextStyle>;

export type Type2Variant = keyof typeof type2;

/** Batas pembesaran huruf sistem supaya tata letak tidak rusak. */
export const MAX_FONT_SCALE = 1.3;
