import { formatSusut, percentOfGram } from './susut';

describe('susut', () => {
  it('formats crushed and lost in one line', () => {
    expect(
      formatSusut({
        crushedGram: '80.00',
        lostGram: '-120.00',
        lostPercent: '-4.00',
        baseGram: '3000.00',
      }),
    ).toBe('Hancur 80 gr (2,7%) · Hilang −120 gr (−4,0%)');
  });
  it('shows a single legacy number as Hilang', () => {
    expect(formatSusut({ legacyGram: '50.00', baseGram: '1000.00' })).toBe('Hilang −50 gr (−5,0%)');
  });
  it('returns null without data', () => {
    expect(formatSusut({})).toBeNull();
  });
  it('skips percent when base is empty', () => {
    expect(percentOfGram('10.00', '0.00')).toBeNull();
    expect(formatSusut({ legacyGram: '50.00' })).toBe('Hilang −50 gr');
  });
});
