/**
 * Rasio kontras WCAG 2.x. Warna rgba dicampur dulu ke latar di bawahnya.
 */
type Rgb = [number, number, number];

function parse(color: string): { rgb: Rgb; a: number } {
  const c = color.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(c);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], a: 1 };
  }
  const m = /^rgba?\(([^)]+)\)$/i.exec(c);
  if (m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return { rgb: [Number(r), Number(g), Number(b)], a: Number(a) };
  }
  throw new Error(`Warna tidak dikenal: ${color}`);
}

/** Warna `top` (boleh rgba) di atas `bottom` (padat). */
export function composite(top: string, bottom: string): Rgb {
  const t = parse(top);
  const b = parse(bottom).rgb;
  return [0, 1, 2].map(i => t.rgb[i] * t.a + b[i] * (1 - t.a)) as Rgb;
}

function luminance([r, g, b]: Rgb): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Kontras `fg` di atas `bg`; keduanya boleh rgba, dicampur ke `base` (latar kartu). */
export function contrastRatio(fg: string, bg: string, base = '#FFFFFF'): number {
  const bgRgb = composite(bg, base);
  const bgHex = `rgb(${bgRgb.map(Math.round).join(',')})`;
  const fgRgb = composite(fg, bgHex);
  const l1 = luminance(fgRgb);
  const l2 = luminance(bgRgb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
