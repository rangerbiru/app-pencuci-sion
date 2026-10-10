import { Submission } from '@/types';
import { submissionQuantity, submissionTitle } from './SubmissionItem';

const s = (over: Partial<Submission> = {}): Submission =>
  ({
    id: 1,
    type: { code: 'ambil_bahan', label: 'Ambil Bahan' },
    status: { code: 'menunggu', label: 'Menunggu' },
    work_date: '2026-10-08',
    worker: { id: 4, name: 'Siti' },
    batch_assignment_id: 1,
    batch_code: 'B-MOB-01',
    item: 'Sudut Putih',
    gram: '100.00',
    pcs: null,
    photo_url: null,
    photo_taken_at: null,
    submitted_at: '2026-10-08T12:27:00+07:00',
    decided_by: null,
    decided_at: null,
    reject_reason: null,
    daily_work_card_id: null,
    ...over,
  }) as Submission;

describe('kartu pengajuan ringkas', () => {
  it('shows type and amount in sentence case', () => {
    expect(submissionTitle(s())).toBe('Ambil bahan, 100 gr');
    expect(
      submissionTitle(
        s({ gram: null, pcs: 240, type: { code: 'serah_lembab', label: 'Serah Lembab' } }),
      ),
    ).toBe('Serah lembab, 240 pcs');
  });

  it('adds the worker name in the verification queue', () => {
    expect(submissionTitle(s(), true)).toBe('Siti: Ambil bahan, 100 gr');
    expect(submissionQuantity(s({ gram: null, pcs: null }))).toBe('-');
  });
});
