import tokens from './tokens.json';

/** Jarak, radius, dan ukuran sentuh. Satuan 4 dp seperti web. */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  badge: tokens.radius.badge,
  button: tokens.radius.button,
  input: tokens.radius.input,
  table: tokens.radius.table,
  card: tokens.radius.card,
  // kartu Hari ini dan lembar bawah memakai radius kartu web
  sheet: tokens.radius.card,
} as const;

export const sizes = {
  gutter: tokens.spacing.gutterMobile,
  /** target sentuh minimal (brief: 48 dp) */
  touch: 48,
  /** tombol utama di zona jempol (brief: minimal 56 dp) */
  primaryButton: 56,
  /** tombol sekunder = tinggi tombol web */
  button: tokens.spacing.buttonHeight,
  /** isian dinaikkan dari 44 (web) ke 52 untuk jari basah */
  input: 52,
  icon: 24,
  headerEmblem: 32,
} as const;

export const shadow = {
  // hanya dipakai di kartu Hari ini dan bilah aksi bawah; kartu lain cukup garis 1 dp
  xs: tokens.shadow.reactNative.xs,
} as const;
