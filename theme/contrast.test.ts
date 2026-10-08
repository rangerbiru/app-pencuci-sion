import { badgeColors, darkColors, lightColors, ThemeColors } from './colors';
import { contrastRatio } from './contrast';

type Pair = [keyof ThemeColors, keyof ThemeColors, number];

/** Teks 4,5:1; garis isian, ikon, dan pil 3:1 (WCAG 2.1 AA, 1.4.3 dan 1.4.11). */
const PAIRS: Pair[] = [
  ['text', 'background', 4.5],
  ['text', 'surface', 4.5],
  ['textSecondary', 'background', 4.5],
  ['textSecondary', 'surface', 4.5],
  ['textSecondary', 'pressed', 4.5],
  ['text', 'pressed', 4.5],
  ['placeholder', 'fieldBackground', 4.5],
  ['text', 'fieldBackground', 4.5],
  ['link', 'surface', 4.5],
  ['danger', 'surface', 4.5],
  ['danger', 'dangerBg', 4.5],
  ['warning', 'surface', 4.5],
  ['warning', 'warningBg', 4.5],
  ['success', 'surface', 4.5],
  ['success', 'successBg', 4.5],
  ['info', 'infoBg', 4.5],
  ['onAccent', 'accent', 4.5],
  ['onHeader', 'header', 4.5],
  ['onHeaderMuted', 'header', 4.5],
  ['onNavIndicator', 'navIndicator', 4.5],
  ['fieldBorder', 'fieldBackground', 3],
  ['fieldFocus', 'fieldBackground', 3],
  ['danger', 'fieldBackground', 3],
];

describe.each([
  ['terang', lightColors],
  ['gelap', darkColors],
])('kontras mode %s', (_name, c) => {
  it.each(PAIRS)('%s di atas %s >= %d', (fg, bg, min) => {
    expect(contrastRatio(c[fg], c[bg], c.surface)).toBeGreaterThanOrEqual(min);
  });

  it('teks badge terbaca di semua warna badge', () => {
    const map = c === lightColors ? badgeColors.light : badgeColors.dark;
    for (const tone of Object.values(map)) {
      expect(contrastRatio(tone.text, tone.bg, c.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
