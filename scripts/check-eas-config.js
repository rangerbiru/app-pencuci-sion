// Cek config publik sebuah profil eas.json: node scripts/check-eas-config.js [profil=preview]
// Build cloud EAS tidak membaca .env; skrip ini meniru itu: hanya "env" dari eas.json yang dipakai.
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const profile = process.argv[2] || 'preview';
const eas = require(path.join(__dirname, '..', 'eas.json'));
const env = eas.build?.[profile]?.env;
if (!env) {
  console.error(`Profil "${profile}" tidak ada atau tidak punya "env" di eas.json`);
  process.exit(1);
}

const result = spawnSync('npx', ['expo', 'config', '--type', 'public', '--json'], {
  env: { ...process.env, EXPO_NO_DOTENV: '1', ...env },
  encoding: 'utf8',
});
if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}
const config = JSON.parse(result.stdout);
console.log(`Profil     ${profile}`);
console.log(`owner      ${config.owner}`);
console.log(`projectId  ${config.extra?.eas?.projectId}`);
console.log(`API_URL    ${config.extra?.apiUrl}`);
