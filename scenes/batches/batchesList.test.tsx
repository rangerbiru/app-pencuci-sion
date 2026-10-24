import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import Batches from './Batches';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
}));
jest.mock('@/components/layouts/Screen', () => {
  const { View } = jest.requireActual('react-native');
  const { createElement } = jest.requireActual('react');
  return {
    __esModule: true,
    default: ({ children }: { children: unknown }) => createElement(View, null, children),
  };
});

const status = { code: 'received', label: 'Diterima' };
const batch = (over: object) => ({
  id: 1,
  batch_code: 'B-1',
  item: 'Mangkok',
  grades: [1],
  status,
  sent_gram: '3000.00',
  received_gram: '3000.00',
  received_at: '2026-10-20T09:00:00+07:00',
  remaining_gram: '3000.00',
  can_prepare: false,
  assignments: [],
  ...over,
});
let mockRations: object[] = [];
jest.mock('@/services', () => ({
  toApiError: (e: unknown) => e,
  staleError: () => null,
  useGetIncomingBatchesQuery: () => ({ data: [], isLoading: false, isFetching: false }),
  useGetRationBatchesQuery: () => ({
    data: mockRations,
    isLoading: false,
    isFetching: false,
    error: undefined,
    refetch: jest.fn(),
  }),
}));

jest.setTimeout(20000);

describe('Batches > Penjatahan', () => {
  it('lets a G1 batch be rationed and marks gudang assignments', () => {
    mockRations = [
      batch({
        grade: 1,
        ready_for_ration: true,
        needs_preparation: false,
        assignments: [
          {
            id: 31,
            worker: { id: 5, name: 'Siti' },
            target_gram: '500.00',
            modal_bahan: null,
            status,
            executor_role: 'gudang',
          },
        ],
      }),
    ];
    render(<Batches initialTab="jatah" highlightAssignmentId={31} />);
    expect(screen.getByText('Grade 1')).toBeTruthy();
    expect(screen.getByText('Dari Gudang')).toBeTruthy();
    expect(screen.getByText('Buat penjatahan')).toBeTruthy();
    expect(screen.queryByText('Perlu Penyiapan')).toBeNull();
    expect(screen.getByLabelText('Jatah baru dari gudang')).toBeTruthy();
  });

  it('refuses G2/G3: badge, Siapkan dulu, no ration button', () => {
    mockRations = [
      batch({
        id: 2,
        batch_code: 'B-2',
        grade: 3,
        ready_for_ration: false,
        needs_preparation: true,
        can_prepare: true,
      }),
    ];
    render(<Batches initialTab="jatah" />);
    expect(screen.getByText('Grade 3')).toBeTruthy();
    expect(screen.getByText('Perlu Penyiapan')).toBeTruthy();
    expect(screen.queryByText('Buat penjatahan')).toBeNull();
    fireEvent.press(screen.getByText('Siapkan dulu'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/batch/siapkan/[id]',
      params: { id: '2' },
    });
  });

  it('does not offer a dead-end Siapkan dulu when the batch is no longer preparable', () => {
    mockRations = [
      batch({
        id: 3,
        batch_code: 'B-3',
        grade: 3,
        ready_for_ration: false,
        needs_preparation: true,
        can_prepare: false,
      }),
    ];
    render(<Batches initialTab="jatah" />);
    expect(screen.getByText('Perlu Penyiapan')).toBeTruthy();
    expect(screen.queryByText('Siapkan dulu')).toBeNull();
    expect(screen.queryByText('Buat penjatahan')).toBeNull();
    expect(screen.getByText(/sebagian sudah dijatah/)).toBeTruthy();
  });
});
