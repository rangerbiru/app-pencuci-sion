import { render, screen } from '@testing-library/react-native';
import WorkCardSummary from './WorkCardSummary';
import type { WorkCard } from '@/types';

const status = (code: string, label: string) => ({ code, label });
const card = (rows: unknown): WorkCard =>
  ({
    id: 1,
    work_date: '2026-10-26',
    worker: { id: 7, name: 'Siti' },
    location: null,
    status: status('draft', 'Draft'),
    qc_status: null,
    rework_date: null,
    verified: false,
    verified_at: null,
    verified_by: null,
    material: { gram: '1500.00', pcs: null, rows },
    pcs_lembab: null,
    result: { gram: null, groups: [], rows: [] },
    wage: null,
  }) as unknown as WorkCard;

describe('WorkCardSummary material rows', () => {
  it('shows the item, batch and nota of each line', () => {
    render(
      <WorkCardSummary
        card={card([
          {
            batch_assignment_id: 1,
            batch_code: 'B-MB',
            batch_line_id: 31,
            nota: 'NP-001',
            item: 'Patahan A',
            gram: '1000.00',
            pcs: null,
          },
          {
            batch_assignment_id: 2,
            batch_code: 'B-MB',
            batch_line_id: 33,
            nota: 'NP-003',
            item: 'Patahan C',
            gram: '500.00',
            pcs: null,
          },
        ])}
      />,
    );
    expect(screen.getByText('Patahan A')).toBeTruthy();
    expect(screen.getByText('Batch B-MB · Nota NP-001')).toBeTruthy();
    expect(screen.getByText('Batch B-MB · Nota NP-003')).toBeTruthy();
  });

  it('leaves the nota out for an old combined batch and survives missing rows', () => {
    render(
      <WorkCardSummary
        card={card([
          {
            batch_assignment_id: 1,
            batch_code: 'B-OLD',
            batch_line_id: null,
            nota: null,
            item: 'Mangkok',
            gram: '1500.00',
            pcs: null,
          },
        ])}
      />,
    );
    expect(screen.getByText('Batch B-OLD')).toBeTruthy();
    expect(() => render(<WorkCardSummary card={card(undefined)} />)).not.toThrow();
  });
});
