import { displayFromValue, formatNumberInput } from './numberInput';

describe('formatNumberInput rupiah (0 desimal)', () => {
  it('adds dot thousands while typing and sends digits only', () => {
    expect(formatNumberInput('1000000', 0)).toEqual({ display: '1.000.000', value: '1000000' });
    expect(formatNumberInput('1.000.0000', 0)).toEqual({
      display: '10.000.000',
      value: '10000000',
    });
  });

  it('handles pasted formatted text', () => {
    expect(formatNumberInput('Rp 1.000.000', 0).value).toBe('1000000');
    expect(formatNumberInput('Rp 1.000.000,00', 0).value).toBe('1000000');
    expect(formatNumberInput('1,000', 0).value).toBe('1');
  });

  it('clears to empty and drops leading zeros', () => {
    expect(formatNumberInput('', 0)).toEqual({ display: '', value: '' });
    expect(formatNumberInput('007', 0)).toEqual({ display: '7', value: '7' });
    expect(formatNumberInput('abc', 0)).toEqual({ display: '', value: '' });
  });
});

describe('formatNumberInput gram (2 desimal)', () => {
  it('uses comma decimals and dot thousands', () => {
    expect(formatNumberInput('1250,5', 2)).toEqual({ display: '1.250,5', value: '1250.5' });
    expect(formatNumberInput('1.250,55', 2)).toEqual({ display: '1.250,55', value: '1250.55' });
    expect(formatNumberInput('1250,555', 2).value).toBe('1250.55');
  });

  it('keeps a trailing comma while typing', () => {
    expect(formatNumberInput('1250,', 2)).toEqual({ display: '1.250,', value: '1250' });
    expect(formatNumberInput(',5', 2)).toEqual({ display: '0,5', value: '0.5' });
  });

  it('treats a freshly typed dot as the decimal comma', () => {
    expect(formatNumberInput('1.250.', 2, '1.250')).toEqual({ display: '1.250,', value: '1250' });
  });

  it('reads pasted dot-decimal and dot-thousand text', () => {
    expect(formatNumberInput('1250.5', 2).value).toBe('1250.5');
    expect(formatNumberInput('1.250', 2).value).toBe('1250');
    expect(formatNumberInput('12.500,00 gr', 2).value).toBe('12500.00');
  });
});

describe('displayFromValue', () => {
  it('formats API values for the input', () => {
    expect(displayFromValue('1250.50', 2)).toBe('1.250,5');
    expect(displayFromValue('12500.00', 2)).toBe('12.500');
    expect(displayFromValue('1000000.00', 0)).toBe('1.000.000');
    expect(displayFromValue('', 0)).toBe('');
  });
});
