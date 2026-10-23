import { fromCents, toCents } from './decimal';
import { formatGram } from './format';

/** tanda minus sebenarnya (U+2212), bukan tanda hubung, untuk angka negatif susut */
export const MINUS = '−';

/** Persen dari `base` dengan satu desimal, mis. "2,7%" / "-4,0%"; null bila basis kosong atau 0. */
export function percentOfGram(gram: string | null | undefined, base: string | null | undefined) {
  const g = toCents(gram ?? null);
  const b = toCents(base ?? null);
  if (g === null || b === null || b === 0n) return null;
  const neg = g < 0n !== b < 0n && g !== 0n;
  const ga = g < 0n ? -g : g;
  const ba = b < 0n ? -b : b;
  // satu desimal persen = per seribu, dibulatkan ke terdekat
  const tenths = (ga * 1000n * 2n + ba) / (ba * 2n);
  const text = `${tenths / 10n},${tenths % 10n}`;
  return neg && tenths !== 0n ? `-${text}%` : `${text}%`;
}

/** "-4.00" dari server (dua desimal) -> "-4,0%" */
export function percentFromServer(value: string | null | undefined) {
  const c = toCents(value ?? null);
  if (c === null) return null;
  const neg = c < 0n;
  const abs = neg ? -c : c;
  const tenths = (abs + 5n) / 10n;
  return `${neg && tenths !== 0n ? '-' : ''}${tenths / 10n},${tenths % 10n}%`;
}

const withRealMinus = (s: string) => s.replace(/^-/, MINUS);

/** "−120 gr" untuk gram hilang; `value` boleh positif (data lama) atau negatif, selalu tampil negatif. */
export function formatLostGram(value: string | null | undefined): string {
  const c = toCents(value ?? null);
  if (c === null) return '-';
  const neg = c > 0n ? -c : c;
  return withRealMinus(formatGram(fromCents(neg)));
}

export function formatLostPercent(value: string | null | undefined): string | null {
  if (!value) return null;
  return withRealMinus(value);
}

export interface SusutParts {
  /** teks "Hancur X gr (Y%)" atau null bila tidak ada data hancur */
  crushed: string | null;
  /** teks "Hilang −X gr (−Y%)" atau null bila tidak ada data */
  lost: string | null;
}

export interface SusutInput {
  crushedGram?: string | null;
  /** negatif (revisi 22/10) */
  lostGram?: string | null;
  lostPercent?: string | null;
  /** data lama yang hanya punya satu angka susut: ditampilkan sebagai Hilang */
  legacyGram?: string | null;
  /** gram masuk, untuk menghitung persen bila server tidak mengirimnya */
  baseGram?: string | null;
}

export function susutParts(i: SusutInput): SusutParts {
  const hasCrushed = i.crushedGram != null && i.crushedGram !== '';
  const crushed = hasCrushed
    ? `Hancur ${formatGram(i.crushedGram)}${(() => {
        const p = percentOfGram(i.crushedGram, i.baseGram);
        return p ? ` (${p})` : '';
      })()}`
    : null;
  const lostSource = i.lostGram != null && i.lostGram !== '' ? i.lostGram : i.legacyGram;
  let lost: string | null = null;
  if (lostSource != null && lostSource !== '') {
    const c = toCents(lostSource);
    if (c !== null) {
      const negCents = c > 0n ? -c : c;
      const gram = formatLostGram(lostSource);
      const pct =
        i.lostPercent != null && i.lostPercent !== ''
          ? percentFromServer(i.lostPercent)
          : percentOfGram(fromCents(negCents), i.baseGram);
      lost = `Hilang ${gram}${pct ? ` (${withRealMinus(pct)})` : ''}`;
    }
  }
  return { crushed, lost };
}

/** Satu baris: "Hancur 80 gr (2,7%) · Hilang −120 gr (−4,0%)" */
export function formatSusut(i: SusutInput): string | null {
  const { crushed, lost } = susutParts(i);
  const parts = [crushed, lost].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}
