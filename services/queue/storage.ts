import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { QueueItem } from './types';

/**
 * Antrean disimpan di AsyncStorage (tidak rahasia: tidak ada token di sini).
 * Foto yang sudah dikompres disalin ke folder dokumen supaya tidak hilang saat cache dibersihkan.
 */
const KEY = 'sion.queue.v1';
const DIR_NAME = 'sion-queue';

export async function loadQueue(): Promise<QueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const items = raw ? (JSON.parse(raw) as QueueItem[]) : [];
    // item yang terputus saat dikirim (aplikasi ditutup) kembali menunggu
    return items.map(i => (i.status === 'sending' ? { ...i, status: 'pending' } : i));
  } catch {
    return [];
  }
}

export async function saveQueue(items: QueueItem[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

function queueDir(): Directory {
  const dir = new Directory(Paths.document, DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** Salin foto ke folder antrean; mengembalikan URI baru. */
export function persistFile(uri: string, id: string, field: string): string {
  if (Platform.OS === 'web') return uri;
  const target = new File(queueDir(), `${id}-${field}.jpg`);
  if (target.exists) return target.uri;
  new File(uri).copy(target);
  return target.uri;
}

export function deleteFiles(item: QueueItem): void {
  if (Platform.OS === 'web') return;
  Object.values(item.files).forEach(uri => {
    try {
      const f = new File(uri);
      if (f.exists) f.delete();
    } catch {
      // berkas sudah tidak ada; abaikan
    }
  });
}
