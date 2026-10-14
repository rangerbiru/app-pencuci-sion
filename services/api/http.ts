import { Platform } from 'react-native';
import config from '@/utils/config';
import { getToken } from '@/services/auth/tokenStorage';
import { ApiError, httpError, NETWORK_MESSAGE, TIMEOUT_MESSAGE } from './errors';
import { devNetworkDetail, diagnoseNetworkFailure } from './networkDiagnosis';

/**
 * Klien HTTP tunggal untuk RTK Query dan antrean kirim ulang.
 * - Accept: application/json, Authorization: Bearer <token>
 * - 401 memanggil handler logout (dipasang di app, lihat setUnauthorizedHandler)
 * - error jaringan/timeout dibedakan dari error HTTP
 */

export interface HttpRequest {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string | number | undefined | null>;
  body?: unknown;
  idempotencyKey?: string;
  auth?: boolean;
  timeoutMs?: number;
}

export type HttpResult<T> = { ok: true; status: number; data: T } | { ok: false; error: ApiError };

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function buildUrl(path: string, params?: HttpRequest['params']): string {
  const base = config.apiBase;
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  if (!params) return url;
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${url}?${qs}` : url;
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 200) };
  }
}

export async function http<T>(req: HttpRequest): Promise<HttpResult<T>> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getToken();
  if (req.auth !== false && token) headers.Authorization = `Bearer ${token}`;
  if (req.idempotencyKey) headers['Idempotency-Key'] = req.idempotencyKey;

  let body: BodyInit | undefined;
  if (req.body instanceof FormData) {
    body = req.body;
  } else if (req.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(req.body);
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeoutMs = req.timeoutMs ?? config.requestTimeoutMs;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const url = buildUrl(req.path, req.params);
  let res: Response;
  try {
    res = await fetch(url, {
      method: req.method ?? 'GET',
      headers,
      body,
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    const error: ApiError = {
      kind: timedOut ? 'timeout' : 'network',
      status: null,
      message: timedOut ? TIMEOUT_MESSAGE : NETWORK_MESSAGE,
      fieldErrors: {},
    };
    if (__DEV__) {
      // build pengembangan: tampilkan alamat yang dicoba dan penyebabnya
      const platform = Platform.OS;
      error.cause = await diagnoseNetworkFailure(url, { timedOut, platform, error: e });
      error.message += `\n${devNetworkDetail(url, error.cause, {
        platform,
        timeoutMs,
        origin: platform === 'web' ? globalThis.location?.origin : undefined,
      })}`;
    }
    return { ok: false, error };
  }
  clearTimeout(timer);

  const data = await readJson(res);
  if (res.ok) return { ok: true, status: res.status, data: data as T };

  if (res.status === 401 && req.auth !== false) onUnauthorized?.();
  const retryAfterHeader = res.headers.get('Retry-After');
  const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
  return { ok: false, error: httpError(res.status, data, retryAfter) };
}
