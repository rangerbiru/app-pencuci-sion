import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import config from './config';

export interface Photo {
  uri: string;
  width: number;
  height: number;
  /** waktu foto diambil di HP (ISO 8601) */
  takenAt: string;
}

/** Ukuran baru dengan sisi terpanjang maksimal `maxSide`, rasio tetap. */
export function fitWithin(width: number, height: number, maxSide: number) {
  const longest = Math.max(width, height);
  if (longest <= maxSide || longest === 0) return { width, height };
  const scale = maxSide / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Kompres foto sebelum diunggah: sisi terpanjang 1280 px, JPEG 0,7. Server membatasi 2 MB.
 */
export async function compressPhoto(photo: Photo): Promise<Photo> {
  const target = fitWithin(photo.width, photo.height, config.photo.maxSide);
  const ctx = ImageManipulator.manipulate(photo.uri);
  if (target.width !== photo.width || target.height !== photo.height) {
    ctx.resize({ width: target.width, height: target.height });
  }
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ compress: config.photo.quality, format: SaveFormat.JPEG });
  return { uri: saved.uri, width: saved.width, height: saved.height, takenAt: photo.takenAt };
}
