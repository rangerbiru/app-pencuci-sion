import type { Batch } from '@/types';
import { batchSusut } from './batchSusut';
import { formatSusut } from '@/utils/susut';

const b = (over: Partial<Batch>) => ({ sent_gram: '3000.00', ...over }) as Batch;

describe('batchSusut', () => {
  it('uses crushed and lost from the new server', () => {
    const s = batchSusut(b({ receipt_crushed_gram: '80.00', receipt_lost_gram: '-120.00' }));
    expect(formatSusut(s!)).toBe('Hancur 80 gr (2,7%) · Hilang −120 gr (−4,0%)');
  });
  it('shows an old single shrink number as Hilang', () => {
    const s = batchSusut(b({ receipt_shrink_gram: '20.00' }));
    expect(formatSusut(s!)).toBe('Hilang −20 gr (−0,7%)');
  });
  it('shows nothing when there is no shrink, or fields are absent', () => {
    expect(batchSusut(b({ receipt_shrink_gram: '0.00' }))).toBeNull();
    expect(batchSusut(b({}))).toBeNull();
    expect(
      batchSusut(
        b({ receipt_crushed_gram: '0.00', receipt_lost_gram: '0.00', receipt_shrink_gram: '5.00' }),
      ),
    ).toBeNull();
  });
});
