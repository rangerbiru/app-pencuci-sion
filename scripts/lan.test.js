/* global describe, it, expect */
const { corsOrigins, isPrivate, laravelCommand, pickFromInterfaces } = require('./lan');

const v4 = (address, internal = false) => ({ family: 'IPv4', address, internal });

describe('LAN IP detection', () => {
  it('prefers Wi-Fi over cable and skips loopback, docker, and VPN', () => {
    expect(
      pickFromInterfaces({
        lo: [v4('127.0.0.1', true)],
        docker0: [v4('172.17.0.1')],
        tailscale0: [v4('100.64.0.2')],
        enp3s0: [v4('192.168.1.20')],
        wlp4s0: [v4('10.78.124.18')],
      }),
    ).toEqual({ ip: '10.78.124.18', iface: 'wlp4s0' });
  });

  it('prefers private addresses and ignores link-local', () => {
    expect(
      pickFromInterfaces({ eth0: [v4('169.254.3.4'), v4('8.8.4.4')], eth1: [v4('192.168.0.9')] }),
    ).toEqual({ ip: '192.168.0.9', iface: 'eth1' });
    expect(pickFromInterfaces({ lo: [v4('127.0.0.1', true)] })).toBeNull();
  });

  it('knows private ranges', () => {
    expect(['10.0.0.1', '172.20.1.1', '192.168.1.1'].every(isPrivate)).toBe(true);
    expect(['172.32.0.1', '8.8.8.8'].some(isPrivate)).toBe(false);
  });

  it('builds the CORS origins and Laravel command for the detected IP', () => {
    expect(corsOrigins('10.0.0.5')).toBe(
      'http://localhost:8081,http://127.0.0.1:8081,http://10.0.0.5:8081',
    );
    expect(laravelCommand('10.0.0.5')).toBe(
      'DB_DATABASE=sion_wms_mobile CORS_ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081,http://10.0.0.5:8081 PHP_CLI_SERVER_WORKERS=4 php artisan serve --host=0.0.0.0 --port=8000 --no-reload',
    );
  });
});
