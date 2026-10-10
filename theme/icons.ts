import type { IconName } from '@/components/elements/Icon';

/**
 * Satu set ikon (Feather, @expo/vector-icons) dengan arti tetap per perintah. Tombol dan ubin
 * memakai ikon dari sini supaya ikon selalu sesuai perintahnya (docs/DESIGN_MOBILE.md).
 */
export const actionIcon = {
  absenMasuk: 'log-in',
  absenPulang: 'log-out',
  ambilBahan: 'download',
  serahHasil: 'upload',
  kerjaUlang: 'repeat',
  terimaBatch: 'inbox',
  penjatahan: 'users',
  penyiapan: 'layers',
  verifikasi: 'shield',
  setujui: 'check',
  tolak: 'x',
  foto: 'camera',
  galeri: 'image',
  scanWadah: 'maximize',
  tambah: 'plus',
  hapus: 'trash-2',
  muatUlang: 'refresh-cw',
  uang: 'credit-card',
  tarikDana: 'arrow-down-circle',
  notifikasi: 'bell',
  hubungiAdmin: 'message-circle',
  keluar: 'log-out',
  kembali: 'arrow-left',
} as const satisfies Record<string, IconName>;
