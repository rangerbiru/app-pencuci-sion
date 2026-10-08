import tokens from './tokens.json';

/**
 * Warna SION. Semua nilai berasal dari theme/tokens.json (salinan docs/web-theme/tokens.json).
 * Jangan menulis hex di layar; pakai useTheme().colors atau badgeColor().
 */
export const palette = tokens.palette;

const light = tokens.colors.light;
const dark = tokens.colors.dark;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSunken: string;
  border: string;
  borderStrong: string;
  header: string;
  onHeader: string;
  onHeaderMuted: string;
  primary: string;
  accent: string;
  accentPressed: string;
  onAccent: string;
  text: string;
  textSecondary: string;
  link: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  info: string;
  infoBg: string;
  focusRing: string;
  overlay: string;
  skeleton: string;
}

export const lightColors: ThemeColors = {
  background: light.background,
  surface: light.surface,
  surfaceSunken: palette.gray['50'],
  border: light.border,
  borderStrong: palette.gray['300'],
  header: light.header,
  onHeader: light.onSidebar,
  onHeaderMuted: light.onSidebarMuted,
  primary: light.primary,
  accent: light.accent,
  accentPressed: light.accentPressed,
  onAccent: light.onAccent,
  text: light.text,
  textSecondary: light.textSecondary,
  link: light.link,
  success: palette.accent['600'],
  successBg: light.successBg,
  // teks peringatan memakai gold-900: gold-600 di atas krem/putih hanya 3,5:1 (gagal AA)
  warning: palette.gold['900'],
  warningBg: light.warningBg,
  danger: light.danger,
  dangerBg: light.dangerBg,
  info: light.info,
  infoBg: light.infoBg,
  focusRing: light.focusRing,
  overlay: 'rgba(11,20,32,0.55)',
  skeleton: palette.gray['200'],
};

export const darkColors: ThemeColors = {
  background: dark.background,
  // RN tidak menumpuk rgba dengan baik di kartu bertingkat; pakai padanan padatnya
  surface: dark.surfaceSolid,
  surfaceSunken: palette.gray['900'],
  border: dark.border,
  borderStrong: palette.gray['700'],
  header: dark.header,
  onHeader: dark.onSidebar,
  onHeaderMuted: dark.onSidebarMuted,
  primary: palette.primary['300'],
  accent: dark.accent,
  accentPressed: dark.accentPressed,
  onAccent: dark.onAccent,
  text: dark.text,
  textSecondary: dark.textSecondary,
  link: dark.link,
  success: dark.success,
  successBg: dark.successBg,
  warning: dark.warning,
  warningBg: dark.warningBg,
  danger: dark.danger,
  dangerBg: dark.dangerBg,
  info: dark.info,
  infoBg: dark.infoBg,
  focusRing: dark.focusRing,
  overlay: 'rgba(0,0,0,0.6)',
  skeleton: palette.gray['800'],
};

export type BadgeTone = 'primary' | 'gold' | 'accent' | 'error' | 'neutral';

type BadgeColorMap = Record<BadgeTone, { bg: string; text: string }>;

const tokenBadges = tokens.badge.colors;

/**
 * Warna badge dari tokens.json. Satu penyesuaian kontras di mode terang: teks gold
 * (#A8842F di #F2E4B8 = 2,76:1) diganti gold-900 dari palet yang sama (8,87:1) supaya
 * terbaca di bawah cahaya terang. Latar dan keluarga warnanya tetap sama dengan web.
 */
export const badgeColors: { light: BadgeColorMap; dark: BadgeColorMap } = {
  light: {
    primary: tokenBadges.primary.light,
    gold: { bg: tokenBadges.gold.light.bg, text: palette.gold['900'] },
    accent: tokenBadges.accent.light,
    error: tokenBadges.error.light,
    neutral: tokenBadges.neutral.light,
  },
  dark: {
    primary: tokenBadges.primary.dark,
    gold: tokenBadges.gold.dark,
    accent: tokenBadges.accent.dark,
    error: tokenBadges.error.dark,
    neutral: tokenBadges.neutral.dark,
  },
};

type StatusTable = Record<string, Record<string, { label: string; color: string }>>;
const statusTable = tokens.status as StatusTable;

export type StatusKind = keyof typeof tokens.status;

/** Warna badge untuk status `kind.code`; status yang tidak dikenal tampil netral. */
export function statusTone(kind: StatusKind, code: string | null | undefined): BadgeTone {
  if (!code) return 'neutral';
  const tone = statusTable[kind]?.[code]?.color;
  return (tone as BadgeTone | undefined) ?? 'neutral';
}

/** Label dari tokens; dipakai hanya bila API tidak mengirim label. */
export function statusLabel(kind: StatusKind, code: string): string {
  return statusTable[kind]?.[code]?.label ?? code;
}

export const colors = { light: lightColors, dark: darkColors, palette };
