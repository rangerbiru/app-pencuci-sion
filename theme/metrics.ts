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
  /** v2: isian 12 (web 8) */
  input: 12,
  table: tokens.radius.table,
  card: tokens.radius.card,
  // kartu Hari ini dan lembar bawah memakai radius kartu web
  sheet: tokens.radius.card,
  /** v2: kartu hero 24, ubin dan isian 12 */
  hero: 24,
  tile: 12,
  pill: 9999,
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
  /** v2: hanya kartu hero dan tombol melayang; warna bayangan navy, bukan hitam */
  hero: {
    shadowColor: tokens.palette.primary['600'],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;
