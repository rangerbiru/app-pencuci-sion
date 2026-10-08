import { http } from '../api/http';
import { buildFormData, FieldValue } from '../api/multipart';
import { ApiError, isRetryable } from '../api/errors';
import { newIdempotencyKey } from '@/utils/id';
import { deleteFiles, loadQueue, persistFile, saveQueue } from './storage';
import { CONFLICT_MEANS_DONE, QUEUE_LABELS, QueueItem, QueueKind, QueueOutcome } from './types';

/**
 * Antrean kirim ulang untuk aksi lapangan (absen, ambil bahan, serah hasil, kerja ulang,
 * konfirmasi timbang, terima batch).
 *
 * Pencegahan kiriman ganda:
 * 1. setiap aksi punya id tetap yang dikirim sebagai header Idempotency-Key;
 * 2. satu item tidak pernah dikirim dua kali bersamaan (set `inFlight`) dan antrean hanya
 *    diproses oleh satu loop (`running`);
 * 3. item dihapus hanya setelah server menjawab 2xx;
 * 4. aksi yang sama (dedupeKey) tidak bisa diantrekan dua kali selama yang pertama tertunda.
 */

export interface QueueListener {
  onChange(items: QueueItem[]): void;
  onSent(item: QueueItem, data: unknown): void;
}

export interface EnqueueInput {
  kind: QueueKind;
  path: string;
  label?: string;
  dedupeKey?: string;
  fields: Record<string, FieldValue>;
  files?: Record<string, string | undefined>;
  json?: boolean;
}

let items: QueueItem[] = [];
let loaded = false;
let running: Promise<void> | null = null;
const inFlight = new Set<string>();
let listener: QueueListener | null = null;
let isOnline: () => boolean = () => true;
let currentUser: () => number | null = () => null;

export function configureQueue(opts: {
  listener: QueueListener;
  isOnline: () => boolean;
  currentUser: () => number | null;
}) {
  listener = opts.listener;
  isOnline = opts.isOnline;
  currentUser = opts.currentUser;
}

async function ensureLoaded() {
  if (loaded) return;
  items = await loadQueue();
  loaded = true;
  listener?.onChange(items);
}

async function commit(next: QueueItem[]) {
  items = next;
  listener?.onChange(items);
  await saveQueue(items);
}

function patch(id: string, change: Partial<QueueItem>) {
  return commit(items.map(i => (i.id === id ? { ...i, ...change } : i)));
}

async function remove(item: QueueItem) {
  deleteFiles(item);
  await commit(items.filter(i => i.id !== item.id));
}

export function getQueue(): QueueItem[] {
  return items;
}

async function send(item: QueueItem) {
  const body = item.json
    ? item.fields
    : buildFormData(
        item.fields,
        Object.fromEntries(Object.entries(item.files).map(([k, uri]) => [k, { uri }])),
      );
  return http<unknown>({
    path: item.path,
    method: 'POST',
    body,
    idempotencyKey: item.id,
    timeoutMs: 60000,
  });
}

type AttemptResult =
  | { kind: 'sent'; data: unknown }
  | { kind: 'retry'; error: ApiError }
  | { kind: 'rejected'; error: ApiError }
  | { kind: 'busy' };

async function attempt(item: QueueItem): Promise<AttemptResult> {
  if (inFlight.has(item.id)) return { kind: 'busy' };
  inFlight.add(item.id);
  try {
    await patch(item.id, { status: 'sending', attempts: item.attempts + 1 });
    const res = await send(item);
    if (res.ok) {
      await remove(item);
      listener?.onSent(item, res.data);
      return { kind: 'sent', data: res.data };
    }
    const error = res.error;
    if (error.status === 409 && CONFLICT_MEANS_DONE.includes(item.kind)) {
      await remove(item);
      listener?.onSent(item, null);
      return { kind: 'sent', data: null };
    }
    if (isRetryable(error)) {
      await patch(item.id, { status: 'pending', lastError: error.message });
      return { kind: 'retry', error };
    }
    await patch(item.id, { status: 'failed', lastError: error.message });
    return { kind: 'rejected', error };
  } finally {
    inFlight.delete(item.id);
  }
}

/**
 * Simpan aksi ke antrean lalu langsung coba kirim.
 * - terkirim: `sent`
 * - tidak ada sinyal / server gangguan: `queued` (tampil "Belum terkirim", dikirim otomatis)
 * - ditolak server (422, 403, 409): `rejected`, item dihapus supaya pengguna memperbaiki isian
 */
export async function enqueue<T = unknown>(input: EnqueueInput): Promise<QueueOutcome<T>> {
  await ensureLoaded();
  if (input.dedupeKey) {
    const dup = items.find(
      i => i.dedupeKey === input.dedupeKey && i.status !== 'failed' && i.owner === currentUser(),
    );
    if (dup) return { status: 'queued', item: dup };
  }
  const id = newIdempotencyKey();
  const files: Record<string, string> = {};
  Object.entries(input.files ?? {}).forEach(([field, uri]) => {
    if (uri) files[field] = persistFile(uri, id, field);
  });
  const item: QueueItem = {
    id,
    kind: input.kind,
    label: input.label ?? QUEUE_LABELS[input.kind],
    path: input.path,
    dedupeKey: input.dedupeKey,
    fields: input.fields,
    files,
    json: input.json ?? false,
    owner: currentUser(),
    createdAt: new Date().toISOString(),
    attempts: 0,
    status: 'pending',
  };
  await commit([...items, item]);

  if (!isOnline()) return { status: 'queued', item };
  const result = await attempt(item);
  if (result.kind === 'sent') return { status: 'sent', data: result.data as T };
  if (result.kind === 'rejected') {
    await remove(items.find(i => i.id === item.id) ?? item);
    return { status: 'rejected', error: result.error };
  }
  return { status: 'queued', item: items.find(i => i.id === item.id) ?? item };
}

/** Kirim semua item yang menunggu, berurutan. Berhenti saat jaringan putus. */
export function processQueue(): Promise<void> {
  if (running) return running;
  running = (async () => {
    await ensureLoaded();
    for (const item of [...items]) {
      if (item.status !== 'pending' || item.owner !== currentUser()) continue;
      if (!isOnline()) break;
      const result = await attempt(item);
      if (result.kind === 'retry' && result.error.kind !== 'http') break;
    }
  })().finally(() => {
    running = null;
  });
  return running;
}

/** Kirim ulang item gagal secara manual (mis. setelah Admin memperbaiki data). */
export async function retryItem(id: string) {
  await ensureLoaded();
  await patch(id, { status: 'pending', lastError: undefined });
  return processQueue();
}

export async function discardItem(id: string) {
  await ensureLoaded();
  const item = items.find(i => i.id === id);
  if (item) await remove(item);
}

/** Hapus semua aksi milik pengguna (dipakai saat keluar dengan sengaja). */
export async function discardOwnedBy(owner: number | null) {
  await ensureLoaded();
  items.filter(i => i.owner === owner).forEach(deleteFiles);
  await commit(items.filter(i => i.owner !== owner));
}

export async function initQueue() {
  await ensureLoaded();
}

/** Hanya untuk test. */
export function __resetQueueForTests() {
  items = [];
  loaded = false;
  running = null;
  inFlight.clear();
}
