import { devNetworkDetail, diagnoseNetworkFailure } from './networkDiagnosis';

const url = 'http://10.0.0.5:8000/api/v1/auth/login';

describe('network diagnosis (dev)', () => {
  it('tells CORS from connection refused on the web with a no-cors probe', async () => {
    const err = new TypeError('Failed to fetch');
    await expect(
      diagnoseNetworkFailure(url, {
        timedOut: false,
        platform: 'web',
        error: err,
        probe: async () => true,
      }),
    ).resolves.toBe('cors');
    await expect(
      diagnoseNetworkFailure(url, {
        timedOut: false,
        platform: 'web',
        error: err,
        probe: async () => false,
      }),
    ).resolves.toBe('refused');
  });

  it('reports timeout first, and native refused vs unreachable from the message', async () => {
    const probe = jest.fn(async () => true);
    await expect(
      diagnoseNetworkFailure(url, { timedOut: true, platform: 'web', error: null, probe }),
    ).resolves.toBe('timeout');
    expect(probe).not.toHaveBeenCalled();
    await expect(
      diagnoseNetworkFailure(url, {
        timedOut: false,
        platform: 'android',
        error: new Error('Failed to connect to /10.0.0.5:8000'),
      }),
    ).resolves.toBe('refused');
    await expect(
      diagnoseNetworkFailure(url, {
        timedOut: false,
        platform: 'android',
        error: new TypeError('Network request failed'),
      }),
    ).resolves.toBe('unreachable');
  });

  it('shows the address and cause, with a loopback hint on the phone', () => {
    expect(
      devNetworkDetail(url, 'cors', {
        platform: 'web',
        timeoutMs: 15000,
        origin: 'http://localhost:8081',
      }),
    ).toBe(
      `[Dev] Alamat: ${url}. Penyebab: CORS, server menjawab tetapi origin http://localhost:8081 tidak ada di CORS_ALLOWED_ORIGINS Laravel.`,
    );
    expect(devNetworkDetail(url, 'timeout', { platform: 'android', timeoutMs: 15000 })).toMatch(
      /timeout, tidak ada jawaban dalam 15 detik/,
    );
    expect(
      devNetworkDetail('http://127.0.0.1:8000/api/v1/meta', 'unreachable', {
        platform: 'android',
        timeoutMs: 8000,
      }),
    ).toMatch(/127\.0\.0\.1\/localhost menunjuk ke HP sendiri/);
    expect(
      devNetworkDetail('http://127.0.0.1:8000/api/v1/meta', 'refused', {
        platform: 'web',
        timeoutMs: 8000,
      }),
    ).not.toMatch(/HP sendiri/);
  });
});
