/**
 * Deteksi IP LAN laptop untuk pengembangan (dev:lan). Tanpa dependensi; dipakai oleh dev-lan.js
 * dan diuji di lan.test.js.
 */
const dgram = require('dgram');
const os = require('os');

/** Antarmuka virtual yang bukan Wi-Fi/kabel ke HP: docker, VM, VPN. */
const VIRTUAL = /^(docker|br-|veth|virbr|vmnet|vboxnet|tun|tap|wg|tailscale|zt|utun|lo)/i;

function isPrivate(ip) {
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

/** Urutan pilihan: Wi-Fi (wl*, Wi-Fi), lalu kabel (en*, eth*), lalu antarmuka privat lain. */
function rank(name) {
  if (/^(wl|wi-?fi|wlan)/i.test(name)) return 0;
  if (/^(en|eth|ethernet)/i.test(name)) return 1;
  return 2;
}

/**
 * Pilih IP dari daftar antarmuka (`os.networkInterfaces()`): IPv4, bukan internal, bukan virtual,
 * alamat privat dulu. `null` bila tidak ada.
 */
function pickFromInterfaces(interfaces) {
  const candidates = [];
  for (const [name, addrs] of Object.entries(interfaces || {})) {
    if (VIRTUAL.test(name)) continue;
    for (const a of addrs || []) {
      const v4 = a.family === 'IPv4' || a.family === 4;
      if (!v4 || a.internal || a.address.startsWith('169.254.')) continue;
      candidates.push({ name, ip: a.address, score: rank(name) + (isPrivate(a.address) ? 0 : 10) });
    }
  }
  candidates.sort((x, y) => x.score - y.score);
  return candidates[0] ? { ip: candidates[0].ip, iface: candidates[0].name } : null;
}

/**
 * IP sumber rute bawaan: socket UDP "terhubung" ke alamat publik (tidak ada paket terkirim), lalu
 * baca alamat lokalnya. Paling tepat bila ada beberapa antarmuka. `null` bila tidak ada rute.
 */
function routeSourceIp() {
  return new Promise(resolve => {
    const s = dgram.createSocket('udp4');
    const done = ip => {
      try {
        s.close();
      } catch {
        // sudah tertutup
      }
      resolve(ip);
    };
    s.on('error', () => done(null));
    try {
      s.connect(53, '8.8.8.8', () => {
        const ip = s.address().address;
        done(ip && ip !== '0.0.0.0' && !ip.startsWith('127.') ? ip : null);
      });
    } catch {
      done(null);
    }
  });
}

/** Nama antarmuka yang memegang IP itu, untuk ditampilkan. */
function interfaceOf(ip, interfaces) {
  for (const [name, addrs] of Object.entries(interfaces || {})) {
    if ((addrs || []).some(a => a.address === ip)) return name;
  }
  return null;
}

/** `LAN_IP` > rute bawaan > pindai antarmuka. */
async function detectLanIp(env = process.env, interfaces = os.networkInterfaces()) {
  if (env.LAN_IP)
    return { ip: env.LAN_IP, iface: interfaceOf(env.LAN_IP, interfaces), source: 'LAN_IP' };
  const viaRoute = await routeSourceIp();
  if (viaRoute && !VIRTUAL.test(interfaceOf(viaRoute, interfaces) || '')) {
    return { ip: viaRoute, iface: interfaceOf(viaRoute, interfaces), source: 'rute bawaan' };
  }
  const picked = pickFromInterfaces(interfaces);
  return picked ? { ...picked, source: 'antarmuka jaringan' } : null;
}

/** Origin pratinjau web yang harus ada di CORS Laravel untuk port Metro itu. */
function corsOrigins(ip, metroPort = 8081) {
  return [
    `http://localhost:${metroPort}`,
    `http://127.0.0.1:${metroPort}`,
    `http://${ip}:${metroPort}`,
  ].join(',');
}

/** Perintah Laravel mobile (dijalankan di repo web-gudang); tidak mengubah .env repo web. */
function laravelCommand(ip, { apiPort = 8000, metroPort = 8081 } = {}) {
  return (
    `DB_DATABASE=sion_wms_mobile CORS_ALLOWED_ORIGINS=${corsOrigins(ip, metroPort)} ` +
    `PHP_CLI_SERVER_WORKERS=4 php artisan serve --host=0.0.0.0 --port=${apiPort} --no-reload`
  );
}

module.exports = {
  corsOrigins,
  detectLanIp,
  isPrivate,
  laravelCommand,
  pickFromInterfaces,
  routeSourceIp,
};
