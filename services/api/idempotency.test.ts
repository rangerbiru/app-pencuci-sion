import { __resetIdempotencyForTests, keyFor, needsKey, settle } from './idempotency';
import type { ApiError } from './errors';

const req = { path: '/me/withdrawals', method: 'POST' as const, body: { amount: '100000.00' } };
const network: ApiError = { kind: 'network', status: null, message: 'x', fieldErrors: {} };
const http422: ApiError = { kind: 'http', status: 422, message: 'x', fieldErrors: {} };

describe('idempotency keys for mutations', () => {
  beforeEach(() => __resetIdempotencyForTests());

  it('only applies to signed-in POST/PUT without an explicit key', () => {
    expect(needsKey(req)).toBe(true);
    expect(needsKey({ path: '/me' })).toBe(false);
    expect(needsKey({ ...req, auth: false })).toBe(false);
    expect(needsKey({ ...req, idempotencyKey: 'k' })).toBe(false);
  });

  it('reuses the key when the same action is resent after no answer', () => {
    const first = keyFor(req);
    settle(req, network);
    expect(keyFor(req)).toBe(first);
  });

  it('uses a new key after the server answered', () => {
    const first = keyFor(req);
    settle(req, null);
    expect(keyFor(req)).not.toBe(first);
    const second = keyFor(req);
    settle(req, http422);
    expect(keyFor(req)).not.toBe(second);
  });

  it('gives different actions different keys', () => {
    expect(keyFor(req)).not.toBe(keyFor({ ...req, body: { amount: '50000.00' } }));
  });
});
