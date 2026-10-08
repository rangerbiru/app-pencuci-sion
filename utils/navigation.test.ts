import { allFeatures } from './config';
import { MAX_TABS, tabLabelLayout, tabsForRole } from './navigation';

describe('tabs per role', () => {
  const all = [...allFeatures];

  it('gives Pencuci Beranda, Pendapatan, Riwayat, Profil', () => {
    expect(tabsForRole('pencuci', all)).toEqual(['beranda', 'pendapatan', 'riwayat', 'profil']);
  });

  it('gives Kepala Pencuci the Pencuci tabs plus Tim', () => {
    expect(tabsForRole('kepala_pencuci', all)).toEqual([
      'beranda',
      'tim',
      'pendapatan',
      'riwayat',
      'profil',
    ]);
  });

  it('gives Mandor Beranda, Batch, Verifikasi, Kartu Kerja, Akun', () => {
    expect(tabsForRole('mandor', all)).toEqual(['beranda', 'batch', 'verifikasi', 'kartu', 'akun']);
  });

  it('never shows more than five tabs', () => {
    for (const role of ['pencuci', 'kepala_pencuci', 'mandor'] as const) {
      expect(tabsForRole(role, all).length).toBeLessThanOrEqual(MAX_TABS);
    }
  });

  it('hides tabs of disabled feature modules', () => {
    const without = all.filter(f => f !== 'batches');
    expect(tabsForRole('mandor', without)).toEqual(['beranda', 'verifikasi', 'kartu', 'akun']);
  });
});

describe('tab label layout', () => {
  const mandor = ['Beranda', 'Batch', 'Verifikasi', 'Kartu Kerja', 'Akun'];
  const kepala = ['Beranda', 'Tim', 'Pendapatan', 'Riwayat', 'Profil'];
  const em: Record<string, number> = { Verifikasi: 4.41, Kartu: 2.66, Pendapatan: 5.76 };

  function fits(labels: string[], width: number, scale: number) {
    const { fontSize, lines } = tabLabelLayout(labels, width, scale);
    const avail = width / labels.length - 2;
    return labels.every(l => {
      const words = lines === 2 ? l.split(' ') : [l];
      return words.every(w => (em[w] ?? (w === 'Kartu Kerja' ? 5.35 : 4.0)) * fontSize <= avail);
    });
  }

  it('keeps one line at 12 at normal size on 360 dp', () => {
    expect(tabLabelLayout(mandor, 360, 1)).toEqual({ fontSize: 12, lines: 1 });
  });

  it('fits every label at 130% on 360 and 412 dp', () => {
    for (const w of [360, 412]) {
      expect(fits(mandor, w, 1.3)).toBe(true);
      expect(fits(kepala, w, 1.3)).toBe(true);
    }
  });

  it('wraps two-word labels before shrinking the text', () => {
    const layout = tabLabelLayout(mandor, 360, 1.3);
    expect(layout.lines).toBe(2);
    expect(layout.fontSize).toBeGreaterThan(14);
  });
});
