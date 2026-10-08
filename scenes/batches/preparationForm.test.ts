import { preparationTotals, validatePreparation } from './preparationForm';

const at = '2026-10-08';

describe('preparation form', () => {
  it('computes output and shrinkage without floats', () => {
    const t = preparationTotals('5950.00', [
      { key: 'a', itemId: 1, gram: '4000', pcs: '' },
      { key: 'b', itemId: 2, gram: '1500.5', pcs: '' },
    ]);
    expect(t).toEqual({ outputGram: '5500.50', susutGram: '449.50', over: false });
  });

  it('builds the API payload when valid', () => {
    const res = validatePreparation(
      {
        processType: 'kering',
        notes: ' ',
        lines: [{ key: 'a', itemId: 1, gram: '4000', pcs: '320' }],
      },
      '5950.00',
      at,
    );
    expect(res).toEqual({
      ok: true,
      body: {
        prepared_at: at,
        process_type: 'kering',
        notes: null,
        outputs: [{ item_id: 1, weight: '4000.00', jumlah_keping: 320 }],
      },
    });
  });

  it('rejects missing process, empty rows, and output above input', () => {
    const empty = validatePreparation({ processType: null, notes: '', lines: [] }, '100.00', at);
    expect(!empty.ok && empty.errors.processType).toBeTruthy();
    expect(!empty.ok && empty.errors.lines).toMatch(/minimal satu/);

    const over = validatePreparation(
      { processType: 'basah', notes: '', lines: [{ key: 'a', itemId: 1, gram: '150', pcs: '' }] },
      '100.00',
      at,
    );
    expect(!over.ok && over.errors.lines).toMatch(/melebihi/);

    const row = validatePreparation(
      {
        processType: 'basah',
        notes: '',
        lines: [{ key: 'a', itemId: null, gram: '', pcs: '1,5' }],
      },
      '100.00',
      at,
    );
    expect(!row.ok && row.errors.rows.a).toEqual({
      item: 'Pilih item hasil.',
      gram: 'Isi gram hasil.',
      pcs: 'Pcs harus bilangan bulat.',
    });
  });
});
