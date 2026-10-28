import { render, screen } from '@testing-library/react-native';
import RationList from '@/scenes/home/RationList';
import TakeMaterialForm from './TakeMaterialForm';

jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const ration = (over: object) => ({
  batch_assignment_id: 1,
  batch_code: 'B-MB',
  item: 'Patahan A',
  target_gram: '1000.00',
  taken_gram: '0.00',
  pending_gram: '0.00',
  remaining_gram: '1000.00',
  taken_pcs: null,
  status: { code: 'aktif', label: 'Aktif' },
  ...over,
});

describe('RationList nota', () => {
  it('shows the line item and nota on the jatah card, and no nota for old jatah', () => {
    render(
      <RationList
        rations={[
          ration({ nota: 'NP-001', batch_line_id: 31 }),
          ration({ batch_assignment_id: 2, batch_code: 'B-OLD', item: 'Mangkok' }),
        ]}
      />,
    );
    expect(screen.getByText('Batch B-MB · Nota NP-001')).toBeTruthy();
    expect(screen.getByText('Batch B-OLD')).toBeTruthy();
  });
});

describe('TakeMaterialForm nota', () => {
  it('shows the nota under the item', () => {
    render(
      <TakeMaterialForm
        ration={ration({ nota: 'NP-001' }) as never}
        photoUri="file:///x.jpg"
        onRetakePhoto={jest.fn()}
        onValid={jest.fn()}
      />,
    );
    expect(screen.getByText('Batch B-MB · Nota NP-001')).toBeTruthy();
  });
});
