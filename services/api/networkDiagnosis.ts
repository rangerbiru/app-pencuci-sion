/**
 * Diagnosis galat koneksi untuk build pengembangan (__DEV__): alamat yang dicoba dan penyebabnya,
 * supaya salah IP, Laravel belum jalan, atau CORS langsung terlihat di layar. Build rilis tidak
 * memakainya (pesan tetap ramah pengguna).
 */
export type NetworkCause = 'timeout' | 'cors' | 'refused' | 'unreachable';

export interface DiagnoseOptions {
  timedOut: boolean;
  platform: string;
  /** galat yang dilempar fetch */
  error: unknown;
  /** web: apakah server menjawab permintaan `no-cors` ke alamat yang sama */
  probe?: (url: string) => Promise<boolean>;
}

/** Permintaan `no-cors` tidak diblokir CORS: berhasil = server hidup, berarti yang menolak CORS. */
async function noCorsProbe(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    await fetch(url, { mode: 'no-cors', signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function diagnoseNetworkFailure(
  url: string,
  { timedOut, platform, error, probe = noCorsProbe }: DiagnoseOptions,
): Promise<NetworkCause> {
  if (timedOut) return 'timeout';
  // peramban menyamakan CORS dan koneksi ditolak ("Failed to fetch"): bedakan dengan probe
  if (platform === 'web') return (await probe(url)) ? 'cors' : 'refused';
  const message = error instanceof Error ? error.message : String(error);
  // React Native hanya memberi "Network request failed" untuk ditolak maupun tak terjangkau
  return /refused|ECONNREFUSED|Failed to connect/i.test(message) ? 'refused' : 'unreachable';
}

function isLoopback(url: string) {
  return /^https?:\/\/(127\.\d+\.\d+\.\d+|localhost)(:|\/|$)/i.test(url);
}

/** Satu kalimat untuk ditempel di bawah pesan galat biasa. */
export function devNetworkDetail(
  url: string,
  cause: NetworkCause,
  { platform, timeoutMs, origin }: { platform: string; timeoutMs: number; origin?: string },
): string {
  const reason = {
    timeout: `timeout, tidak ada jawaban dalam ${Math.round(timeoutMs / 1000)} detik (IP laptop berubah, firewall, atau HP di Wi-Fi lain)`,
    cors: `CORS, server menjawab tetapi origin ${origin ?? 'pratinjau web'} tidak ada di CORS_ALLOWED_ORIGINS Laravel`,
    refused:
      'koneksi ditolak (connection refused), tidak ada server di alamat itu. Jalankan Laravel dengan --host=0.0.0.0 dan cek IP (npm run dev:lan:info)',
    unreachable:
      'koneksi ditolak atau alamat tidak terjangkau (Network request failed). Cek IP laptop (npm run dev:lan:info), Laravel --host=0.0.0.0, dan HP di Wi-Fi yang sama',
  }[cause];
  const loopback =
    platform !== 'web' && isLoopback(url)
      ? ' Di HP, 127.0.0.1/localhost menunjuk ke HP sendiri: jalankan npm run dev:lan.'
      : '';
  return `[Dev] Alamat: ${url}. Penyebab: ${reason}.${loopback}`;
}
