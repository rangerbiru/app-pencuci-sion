import {
  addDecimal,
  compareDecimal,
  fromCents,
  parseUserDecimal,
  parseUserInt,
  subDecimal,
  toCents,
} from './decimal';

describe('decimal helpers', () => {
  it('converts API strings to integer hundredths and back', () => {
    expect(toCents('12500.00')).toBe(1250000n);
    expect(toCents('0.1')).toBe(10n);
    expect(fromCents(1250050n)).toBe('12500.50');
    expect(fromCents(-16n)).toBe('-0.16');
  });

  it('compares without float errors', () => {
    expect(compareDecimal('10000.01', '10000.00')).toBe(1);
    expect(compareDecimal('0.30', '0.3')).toBe(0);
    expect(addDecimal('0.10', '0.20')).toBe('0.30');
    expect(subDecimal('27000.00', '500.50')).toBe('26499.50');
  });

  it('parses Indonesian user input', () => {
    expect(parseUserDecimal('1.250,5')).toBe('1250.50');
    expect(parseUserDecimal('1250,5')).toBe('1250.50');
    expect(parseUserDecimal('1250.5')).toBe('1250.50');
    expect(parseUserDecimal('12.500')).toBe('12500.00');
    expect(parseUserDecimal('')).toBeNull();
    expect(parseUserDecimal('abc')).toBeNull();
  });

  it('parses pcs as whole numbers', () => {
    expect(parseUserInt('1.200')).toBe(1200);
    expect(parseUserInt('12a')).toBeNull();
  });
});
