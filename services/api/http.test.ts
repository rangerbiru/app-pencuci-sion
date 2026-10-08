import { http, setUnauthorizedHandler, buildUrl } from './http';
import { saveToken } from '@/services/auth/tokenStorage';
import { toApiError } from './errors';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 0,
}));

function respond(status: number, body: unknown, headers: Record<string, string> = {}) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => headers[k] ?? null },
    text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
  } as unknown as Response);
}

describe('http client', () => {
  const fetchMock = jest.fn();

  beforeEach(async () => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    await saveToken('12|secret');
  });

  it('sends Accept JSON, Bearer token, and idempotency key', async () => {
    fetchMock.mockReturnValue(respond(200, { data: { ok: true } }));
    const res = await http({ path: '/me', idempotencyKey: 'abc' });
    expect(res.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/me$/);
    expect(init.headers.Accept).toBe('application/json');
    expect(init.headers.Authorization).toBe('Bearer 12|secret');
    expect(init.headers['Idempotency-Key']).toBe('abc');
  });

  it('calls the logout handler on 401', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockReturnValue(respond(401, { message: 'Unauthenticated.' }));
    const res = await http({ path: '/me' });
    expect(res.ok).toBe(false);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    setUnauthorizedHandler(null);
  });

  it('does not log out when the login endpoint itself fails', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockReturnValue(respond(401, {}));
    await http({ path: '/auth/login', method: 'POST', auth: false, body: {} });
    expect(onUnauthorized).not.toHaveBeenCalled();
    setUnauthorizedHandler(null);
  });

  it('maps 422 errors to per-field messages', async () => {
    fetchMock.mockReturnValue(
      respond(422, {
        message: 'Gram (10.000,01 gr) melebihi sisa jatah (10.000,00 gr). Kurangi gramnya.',
        errors: {
          weight: ['Gram (10.000,01 gr) melebihi sisa jatah (10.000,00 gr). Kurangi gramnya.'],
        },
      }),
    );
    const res = await http({ path: '/work/take-material', method: 'POST', body: {} });
    if (res.ok) throw new Error('expected failure');
    expect(res.error.kind).toBe('http');
    expect(res.error.status).toBe(422);
    expect(res.error.fieldErrors.weight).toMatch(/melebihi sisa jatah/);
  });

  it('reports offline errors with a retry message', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    const res = await http({ path: '/me' });
    if (res.ok) throw new Error('expected failure');
    expect(res.error.kind).toBe('network');
    expect(res.error.status).toBeNull();
    expect(res.error.message).toMatch(/Tidak ada sinyal/);
  });

  it('reads Retry-After on 429', async () => {
    fetchMock.mockReturnValue(
      respond(429, { message: 'Too Many Attempts.' }, { 'Retry-After': '42' }),
    );
    const res = await http({ path: '/me' });
    if (res.ok) throw new Error('expected failure');
    expect(res.error.retryAfter).toBe(42);
  });

  it('builds query strings without empty params', () => {
    expect(buildUrl('/work-cards', { date: '2026-09-24', worker: undefined, page: 1 })).toMatch(
      /\/work-cards\?date=2026-09-24&page=1$/,
    );
  });

  it('falls back to a network error for unknown thrown values', () => {
    expect(toApiError(new Error('x')).kind).toBe('network');
  });
});
