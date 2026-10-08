import { newIdempotencyKey } from '@/utils/id';
import type { ApiError } from './errors';
import type { HttpRequest } from './http';

/**
 * Idempotency-Key untuk aksi tulis lewat RTK Query (Tahap 15C, API_MOBILE.md bagian 10).
 * Satu key per aksi pengguna: bila kiriman tidak mendapat jawaban (sinyal putus, timeout),
 * aksi yang sama (method + path + isi) yang dikirim ulang memakai key yang sama, jadi server
 * tidak menjalankannya dua kali. Setelah server menjawab (2xx atau 4xx), aksi berikutnya
 * mendapat key baru.
 */
const pending = new Map<string, { key: string; at: number }>();
const TTL_MS = 24 * 60 * 60 * 1000;

function fingerprint(req: HttpRequest): string {
  let body = '';
  if (typeof FormData !== 'undefined' && req.body instanceof FormData) body = 'multipart';
  else if (req.body !== undefined) body = JSON.stringify(req.body);
  return `${req.method ?? 'GET'} ${req.path} ${body}`;
}

export function needsKey(req: HttpRequest): boolean {
  return (
    (req.method === 'POST' || req.method === 'PUT') && req.auth !== false && !req.idempotencyKey
  );
}

/** Key untuk kiriman ini: dipakai ulang bila kiriman yang sama sebelumnya tidak terjawab. */
export function keyFor(req: HttpRequest, now = Date.now()): string {
  const fp = fingerprint(req);
  const hit = pending.get(fp);
  if (hit && now - hit.at < TTL_MS) return hit.key;
  const key = newIdempotencyKey();
  pending.set(fp, { key, at: now });
  return key;
}

/** Catat hasil: tanpa jawaban server = key disimpan untuk kiriman ulang; selain itu dibuang. */
export function settle(req: HttpRequest, error: ApiError | null): void {
  const fp = fingerprint(req);
  if (error && error.kind !== 'http') return;
  pending.delete(fp);
}

/** Hanya untuk test. */
export function __resetIdempotencyForTests() {
  pending.clear();
}
