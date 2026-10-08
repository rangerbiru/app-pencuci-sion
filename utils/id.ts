import * as Crypto from 'expo-crypto';

/** Kunci idempotensi per aksi; tetap sama selama aksi itu dikirim ulang. */
export function newIdempotencyKey(): string {
  return Crypto.randomUUID();
}
