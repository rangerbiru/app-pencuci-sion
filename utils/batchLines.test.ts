import {
  batchNotaText,
  isRationableLine,
  lineGradeText,
  lineItemName,
  lineNeedsPreparation,
  mustPrepareLines,
  preparableLines,
  rationableLines,
} from './batchLines';

const g1 = {
  id: 1,
  item: { id: 5, name: 'Patahan A' },
  grade: 1,
  nota: 'NP-001',
  sisa_dijatah: '1000.00',
};
const g2 = { id: 2, item: 'Patahan B', grade: 2, nota: 'NP-002', needs_preparation: true };

describe('batch lines helpers', () => {
  it('reads item names from {id,name}, string, or nothing without throwing', () => {
    expect(lineItemName(g1.item)).toBe('Patahan A');
    expect(lineItemName('Patahan B')).toBe('Patahan B');
    expect(lineItemName(null)).toBe('-');
    expect(lineItemName(undefined)).toBe('-');
  });

  it('separates rationable G1 lines from lines that need preparation', () => {
    const batch = { lines: [g1, g2, { id: 3, grade: 1, prepared: true, item: null }] };
    expect(rationableLines(batch).map(l => l.id)).toEqual([1]);
    expect(preparableLines(batch).map(l => l.id)).toEqual([2]);
  });

  it('does not offer a G1 line that has nothing left to ration', () => {
    expect(isRationableLine({ ...g1, sisa_dijatah: '0.00' })).toBe(false);
  });

  it('falls back to the grade when needs_preparation is missing', () => {
    expect(lineNeedsPreparation({ id: 9, item: null, grade: 3 })).toBe(true);
    expect(lineNeedsPreparation({ id: 9, item: null, grade: 1 })).toBe(false);
    expect(lineNeedsPreparation({ id: 9, item: null })).toBe(false);
  });

  it('tolerates a server that sends no lines', () => {
    expect(rationableLines({})).toEqual([]);
    expect(preparableLines({ lines: undefined })).toEqual([]);
  });

  it('builds the batch and nota text, leaving nota out for old assignments', () => {
    expect(batchNotaText('B-1', 'NP-001')).toBe('Batch B-1 · Nota NP-001');
    expect(batchNotaText('B-1', null)).toBe('Batch B-1');
    expect(batchNotaText('B-1', '  ')).toBe('Batch B-1');
  });
});

describe('lineGradeText (revisi 30/10 baris sampingan)', () => {
  it('baris sampingan tampil "Sampingan" walau grade null', () => {
    expect(lineGradeText({ grade: 3, is_byproduct: true })).toBe('G3 · Sampingan');
  });
  it('baris biasa tampil Grade n, tanpa grade = null', () => {
    expect(lineGradeText({ grade: 1 })).toBe('Grade 1');
    expect(lineGradeText({ grade: null })).toBeNull();
  });
  it('baris sampingan langsung boleh dijatahkan', () => {
    const line = {
      id: 1,
      item: 'X',
      grade: null,
      is_byproduct: true,
      needs_preparation: false,
      sisa_dijatah: '500',
    };
    expect(isRationableLine(line)).toBe(true);
  });
  it('sampingan bisa dijatah dan disiapkan lagi; G3 biasa hanya perlu penyiapan', () => {
    const by = {
      id: 1,
      item: 'X',
      grade: 3,
      is_byproduct: true,
      needs_preparation: false,
      sisa_dijatah: '500',
    };
    const g3 = { id: 2, item: 'Y', grade: 3, needs_preparation: true, sisa_dijatah: '500' };
    const batch = { lines: [by, g3] };
    expect(rationableLines(batch).map(l => l.id)).toEqual([1]);
    expect(preparableLines(batch).map(l => l.id)).toEqual([1, 2]);
    expect(mustPrepareLines(batch).map(l => l.id)).toEqual([2]);
  });
});
