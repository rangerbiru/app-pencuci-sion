import { allFeatures } from './config';
import { tabsForRole } from './navigation';

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

  it('gives Mandor Beranda, Batch, Verifikasi, Kartu Kerja, Pendapatan, Profil', () => {
    expect(tabsForRole('mandor', all)).toEqual([
      'beranda',
      'batch',
      'verifikasi',
      'kartu',
      'pendapatan',
      'profil',
    ]);
  });

  it('hides tabs of disabled feature modules', () => {
    const withoutEarnings = all.filter(f => f !== 'earnings' && f !== 'batches');
    expect(tabsForRole('mandor', withoutEarnings)).toEqual([
      'beranda',
      'verifikasi',
      'kartu',
      'profil',
    ]);
  });
});
