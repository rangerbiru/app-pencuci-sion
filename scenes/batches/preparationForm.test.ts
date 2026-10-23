import { preparationTotals, validatePreparation } from './preparationForm';

const at = '2026-10-08';
const base = { processType: 'kering' as const, notes: ' ', g1Gram: '', g1Pcs: '', crushed: [] };

describe('preparation form', () => {
  it('computes lost as a negative number without floats', () => {
    const t = preparationTotals('3000.00', '2800', [{ key: 'a', itemId: 1, gram: '80', pcs: '' }]);
    expect(t).toEqual({
      g1Gram: '2800.00',
      crushedGram: '80.00',
      lostGram: '-120.00',
      over: false,
    });
  });

  it('has no lost when everything is accounted for, and flags overflow', () => {
    expect(
      preparationTotals('1000.00', '900', [{ key: 'a', itemId: 1, gram: '100', pcs: '' }]),
    ).toMatchObject({
      lostGram: '0.00',
      over: false,
    });
    expect(
      preparationTotals('1000.00', '950', [{ key: 'a', itemId: 1, gram: '100', pcs: '' }]),
    ).toMatchObject({
      lostGram: '0.00',
      over: true,
    });
  });

  it('builds the payload without crushed', () => {
    const res = validatePreparation({ ...base, g1Gram: '2800', g1Pcs: '300' }, '3000.00', at);
    expect(res).toEqual({
      ok: true,
      body: {
        prepared_at: at,
        process_type: 'kering',
        notes: null,
        g1_gram: '2800.00',
        g1_pcs: 300,
        crushed: [],
      },
    });
  });

  it('builds the payload with crushed rows', () => {
    const res = validatePreparation(
      { ...base, g1Gram: '2800', crushed: [{ key: 'a', itemId: 9, gram: '80', pcs: '12' }] },
      '3000.00',
      at,
    );
    expect(res.ok && res.body.crushed).toEqual([{ item_id: 9, gram: '80.00', pcs: 12 }]);
  });

  it('rejects G1 + crushed above the incoming gram', () => {
    const res = validatePreparation(
      { ...base, g1Gram: '2950', crushed: [{ key: 'a', itemId: 9, gram: '80', pcs: '' }] },
      '3000.00',
      at,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.total).toMatch(/melebihi/);
  });

  it('rejects negative, empty and incomplete values per field', () => {
    const res = validatePreparation(
      {
        ...base,
        processType: null,
        g1Gram: '-5',
        crushed: [{ key: 'a', itemId: null, gram: '-1', pcs: '' }],
      },
      '3000.00',
      at,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.processType).toBeTruthy();
      expect(res.errors.g1Gram).toMatch(/negatif/);
      expect(res.errors.rows.a).toEqual({
        item: expect.any(String),
        gram: expect.stringMatching(/negatif/),
      });
    }
    const empty = validatePreparation(base, '3000.00', at);
    expect(!empty.ok && empty.errors.g1Gram).toMatch(/Isi/);
  });
});
