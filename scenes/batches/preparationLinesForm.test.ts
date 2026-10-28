import {
  OutputRow,
  preparationLinesTotals,
  selectableTogether,
  validatePreparationLines,
} from './preparationLinesForm';

const line = (id: number, grade: number, sisa: string) => ({
  id,
  item: null,
  grade,
  sisa_dijatah: sisa,
});
const out = (
  key: string,
  type: OutputRow['type'],
  gram: string,
  itemId: number | null = 7,
): OutputRow => ({
  key,
  type,
  itemId,
  gram,
  pcs: '',
  group: 'layak_jual',
});
const base = (outputs: OutputRow[]) => ({
  lineIds: [1, 2],
  processType: 'kering' as const,
  notes: '',
  outputs,
});
const lines = [line(1, 2, '2000.00'), line(2, 2, '1000.00')];

describe('preparationLinesTotals', () => {
  it('sums the lines in and shows lost as a negative number', () => {
    const t = preparationLinesTotals(lines, [
      out('a', 'main', '2500'),
      out('b', 'byproduct', '400'),
    ]);
    expect(t.inputGram).toBe('3000.00');
    expect(t.outputGram).toBe('2900.00');
    expect(t.lostGram).toBe('-100.00');
    expect(t.over).toBe(false);
    expect(t.hasMain).toBe(true);
  });

  it('flags results above the input instead of reporting lost', () => {
    const t = preparationLinesTotals(lines, [out('a', 'main', '3100')]);
    expect(t.over).toBe(true);
    expect(t.lostGram).toBe('0.00');
  });
});

describe('selectableTogether', () => {
  it('only allows lines of the same grade', () => {
    expect(selectableTogether(line(3, 3, '1'), [])).toBe(true);
    expect(selectableTogether(line(3, 3, '1'), [line(1, 2, '1')])).toBe(false);
    expect(selectableTogether(line(2, 2, '1'), [line(1, 2, '1')])).toBe(true);
  });
});

describe('validatePreparationLines', () => {
  it('builds the line_ids and outputs body; group only for byproducts', () => {
    const res = validatePreparationLines(
      base([
        { ...out('a', 'main', '2.500,5'), pcs: '300' },
        { ...out('b', 'byproduct', '400', 9), group: 'retur' },
      ]),
      lines,
      '2026-10-26',
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.body).toEqual({
        prepared_at: '2026-10-26',
        process_type: 'kering',
        notes: null,
        line_ids: [1, 2],
        outputs: [
          { type: 'main', item_id: 7, gram: '2500.50', pcs: 300 },
          { type: 'byproduct', item_id: 9, gram: '400.00', pcs: null, group: 'retur' },
        ],
      });
    }
  });

  it('requires at least one main G1 result', () => {
    const res = validatePreparationLines(base([out('b', 'byproduct', '400')]), lines, '2026-10-26');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.outputs).toBe('Minimal satu hasil utama G1.');
  });

  it('rejects total output above total input', () => {
    const res = validatePreparationLines(base([out('a', 'main', '3500')]), lines, '2026-10-26');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.total).toMatch(/melebihi total gram masuk/);
  });

  it('rejects no lines, mixed grades, no process, no results, and row mistakes', () => {
    const none = validatePreparationLines({ ...base([]), processType: null }, [], '2026-10-26');
    expect(none.ok).toBe(false);
    if (!none.ok) {
      expect(none.errors.lines).toBeTruthy();
      expect(none.errors.processType).toBeTruthy();
      expect(none.errors.outputs).toBe('Tambah paling sedikit satu hasil.');
    }
    const mixed = validatePreparationLines(
      base([out('a', 'main', '100')]),
      [line(1, 2, '1000'), line(2, 3, '1000')],
      '2026-10-26',
    );
    expect(mixed.ok).toBe(false);
    if (!mixed.ok) expect(mixed.errors.lines).toMatch(/satu grade/);
    const bad = validatePreparationLines(
      base([out('a', 'main', '', null), out('b', 'byproduct', '0')]),
      lines,
      '2026-10-26',
    );
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.errors.rows.a).toEqual({ item: 'Pilih item hasil.', gram: 'Isi gram hasil.' });
      expect(bad.errors.rows.b.gram).toBe('Gram hasil harus lebih dari 0.');
    }
  });
});
