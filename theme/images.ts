import { Asset } from 'expo-asset';

/**
 * Logo SION. Berkas masih raster beresolusi rendah; ganti berkasnya saja (nama tetap) saat
 * file final dari klien tersedia.
 * - emblem: ukuran kecil (header, avatar)
 * - logoFull: hanya layar masuk / splash
 */
export const images = {
  emblem: require('@/assets/images/emblem.png'),
  wordmark: require('@/assets/images/wordmark.png'),
  logoFull: require('@/assets/images/logo-full.png'),
} as const;

export const loadImages = async () =>
  Promise.all(Object.values(images).map(m => Asset.fromModule(m as number).downloadAsync()));
