import { formatGram, formatPcs, formatPercent, formatRupiah, progressRatio } from './format';

describe('formatRupiah', () => {
  it('formats API strings with dot thousands, without ,00', () => {
    expect(formatRupiah('1250000.00')).toBe('Rp\u00a01.250.000');
    expect(formatRupiah('30000.00')).toBe('Rp\u00a030.000');
  });

  it('shows decimals only when there are cents', () => {
    expect(formatRupiah('1234.50')).toBe('Rp\u00a01.234,50');
    expect(formatRupiah('41.05')).toBe('Rp\u00a041,05');
  });

  it('supports the Beranda and compact styles from the web', () => {
    expect(formatRupiah('1250000.00', { style: 'whole' })).toBe('Rp\u00a01.250.000');
    expect(formatRupiah('6450.00', { style: 'compact' })).toBe('Rp6.450');
    expect(formatRupiah('41.05', { style: 'compact' })).toBe('Rp41,05');
  });

  it('puts the minus sign before Rp', () => {
    expect(formatRupiah('-0.16')).toBe('-Rp\u00a00,16');
  });

  it('shows a dash for empty values, never zero', () => {
    expect(formatRupiah(null)).toBe('-');
    expect(formatRupiah(undefined)).toBe('-');
    expect(formatRupiah('abc')).toBe('-');
  });

  it('keeps precision of large amounts without float rounding', () => {
    expect(formatRupiah('31520200.00')).toBe('Rp\u00a031.520.200');
    expect(formatRupiah('9007199254740993.01')).toBe('Rp\u00a09.007.199.254.740.993,01');
  });
});

describe('formatGram', () => {
  it('drops ,00 in summaries but keeps real decimals', () => {
    expect(formatGram('1224.00')).toBe('1.224\u00a0gr');
    expect(formatGram('1250.50')).toBe('1.250,50\u00a0gr');
    expect(formatGram('1250.5')).toBe('1.250,50\u00a0gr');
  });

  it('never shows ,00 for whole grams', () => {
    expect(formatGram('2000.00')).toBe('2.000\u00a0gr');
  });

  it('can omit the unit', () => {
    expect(formatGram('12500.00', { unit: false })).toBe('12.500');
  });
});

describe('formatPcs and formatPercent', () => {
  it('formats pcs without decimals', () => {
    expect(formatPcs(2144)).toBe('2.144');
    expect(formatPcs(null)).toBe('-');
  });

  it('formats percent with 2 decimals', () => {
    expect(formatPercent('34.33')).toBe('34,33%');
    expect(formatPercent('-5')).toBe('-5,00%');
  });
});

describe('progressRatio', () => {
  it('clamps between 0 and 1', () => {
    expect(progressRatio('120.00', '240.00')).toBe(0.5);
    expect(progressRatio('300.00', '240.00')).toBe(1);
    expect(progressRatio('1.00', '0.00')).toBe(0);
  });
});
