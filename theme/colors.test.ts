import fs from 'fs';
import path from 'path';
import { badgeColors, lightColors, statusLabel, statusTone } from './colors';

describe('theme tokens', () => {
  it('stays identical to docs/web-theme/tokens.json', () => {
    const read = (p: string) => JSON.parse(fs.readFileSync(path.join(__dirname, p), 'utf8'));
    expect(read('tokens.json')).toEqual(read('../docs/web-theme/tokens.json'));
  });

  it('maps status codes to the web badge colors and labels', () => {
    expect(statusTone('weighing_confirmation', 'menunggu')).toBe('gold');
    expect(statusLabel('weighing_confirmation', 'menunggu')).toBe('Menunggu');
    expect(statusLabel('assignment', 'pending_verification')).toBe('Menunggu Verifikasi');
    expect(statusTone('withdrawal', 'disetujui')).toBe('primary');
    expect(statusTone('work_submission', 'disetujui')).toBe('accent');
    expect(statusTone('bonus', 'unknown_code')).toBe('neutral');
  });

  it('uses brand colors from tokens', () => {
    expect(lightColors.background).toBe('#F7F5F0');
    expect(lightColors.accent).toBe('#C9A24B');
    expect(lightColors.primary).toBe('#1E3A5F');
    expect(badgeColors.light.gold.bg).toBe('#F2E4B8');
  });
});
