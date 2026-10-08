import { validateWithdrawAmount } from './withdrawForm';

describe('validateWithdrawAmount', () => {
  it('accepts amounts between minimum and balance', () => {
    expect(validateWithdrawAmount('100.000', '50000.00', '280000.00')).toEqual({
      ok: true,
      amount: '100000.00',
    });
    expect(validateWithdrawAmount('280.000', '50000.00', '280000.00')).toEqual({
      ok: true,
      amount: '280000.00',
    });
  });

  it('rejects amounts above the balance or below the minimum', () => {
    expect(validateWithdrawAmount('280.001', '50000.00', '280000.00')).toMatchObject({ ok: false });
    expect(validateWithdrawAmount('49.999', '50000.00', '280000.00')).toMatchObject({
      ok: false,
      error: 'Nominal paling sedikit Rp 50.000.',
    });
  });
});
