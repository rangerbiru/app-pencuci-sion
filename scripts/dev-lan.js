#!/usr/bin/env node
/**
 * npm run dev:lan       Expo (HP lewat Expo Go + web) dengan API_URL = IP LAN laptop
 * npm run dev:lan:web   sama, langsung membuka pratinjau web
 * npm run dev:lan:info  hanya tampilkan IP, API_URL, CORS, dan perintah Laravel
 *
 * API_URL hanya untuk sesi ini (variabel lingkungan; .env.dev tidak diubah). dotenvx tidak menimpa
 * variabel yang sudah ada, jadi API_URL dari skrip ini menang atas isi .env.dev.
 * Pilihan: LAN_IP=192.168.1.5 (paksa IP), LARAVEL_PORT=8000, argumen lain diteruskan ke expo
 * (mis. `npm run dev:lan -- --port 8082`).
 */
const { spawn } = require('child_process');
const { corsOrigins, detectLanIp, laravelCommand } = require('./lan');

const args = process.argv.slice(2);
const web = args.includes('--web');
const infoOnly = args.includes('--info');
const passthrough = args.filter(a => a !== '--web' && a !== '--info');
const portIdx = passthrough.findIndex(a => a === '--port' || a === '-p');
const metroPort = portIdx >= 0 ? Number(passthrough[portIdx + 1]) || 8081 : 8081;
const apiPort = Number(process.env.LARAVEL_PORT) || 8000;

/** Laravel sudah menjawab di IP itu? Hanya informasi; Expo tetap dijalankan. */
async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    return res.ok ? 'OK' : `menjawab HTTP ${res.status}`;
  } catch (e) {
    const code = e?.cause?.code;
    if (controller.signal.aborted) return 'tidak menjawab dalam 2,5 detik (timeout)';
    if (code === 'ECONNREFUSED')
      return 'koneksi ditolak (connection refused): Laravel belum jalan di port ini';
    return `gagal (${code ?? e.message})`;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const found = await detectLanIp();
  if (!found) {
    console.error(
      '\nIP LAN laptop tidak terdeteksi. Sambungkan Wi-Fi, atau isi manual:\n' +
        '  LAN_IP=192.168.1.5 npm run dev:lan\n',
    );
    process.exit(1);
  }
  const { ip, iface, source } = found;
  const apiUrl = `http://${ip}:${apiPort}/api/v1`;
  const status = await probe(`${apiUrl}/meta`);

  console.log(
    [
      '',
      '  SION dev:lan',
      `  IP LAN      ${ip}${iface ? ` (${iface})` : ''}, dari ${source}`,
      `  API_URL     ${apiUrl}`,
      `  Cek /meta   ${status}`,
      `  Web         http://localhost:${metroPort} (origin ini harus ada di CORS Laravel)`,
      '',
      '  Laravel (terminal lain, di repo web-gudang):',
      `    ${laravelCommand(ip, { apiPort, metroPort })}`,
      `  CORS_ALLOWED_ORIGINS=${corsOrigins(ip, metroPort)}`,
      '',
    ].join('\n'),
  );
  if (infoOnly) return;

  const expoArgs = [
    'run',
    '-f',
    '.env.dev',
    '--',
    'expo',
    'start',
    '-c',
    ...(web ? ['--web'] : []),
    ...passthrough,
  ];
  const child = spawn('dotenvx', expoArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      API_URL: apiUrl,
      EXPO_NO_DOTENV: '1',
      // QR Expo Go memakai IP yang sama dengan API_URL
      REACT_NATIVE_PACKAGER_HOSTNAME: ip,
    },
  });
  child.on('exit', code => process.exit(code ?? 0));
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
}

main();
