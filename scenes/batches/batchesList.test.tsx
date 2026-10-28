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

  it('lists the batch lines with nota, grade, sisa dijatah, status badges and target_hasil', () => {
    mockRations = [
      batch({
        id: 4,
        batch_code: 'B-4',
        grade: 2,
        ready_for_ration: false,
        needs_preparation: true,
        can_prepare: true,
        target_hasil: 'PK2',
        lines: [
          {
            id: 31,
            item: { id: 5, name: 'Patahan A' },
            grade: 1,
            nota: 'NP-001',
            gram: '1000.00',
            sisa_dijatah: '800.00',
            needs_preparation: false,
            prepared: false,
          },
          {
            id: 32,
            item: { id: 6, name: 'Patahan B' },
            grade: 2,
            nota: 'NP-002',
            gram: '2000.00',
            sisa_dijatah: '2000.00',
            needs_preparation: true,
            prepared: false,
          },
        ],
      }),
    ];
    render(<Batches initialTab="jatah" />);
    expect(screen.getByText('Patahan A')).toBeTruthy();
    expect(screen.getByText('Patahan B')).toBeTruthy();
    expect(screen.getByText('Nota NP-001 · Grade 1')).toBeTruthy();
    expect(screen.getByText('Nota NP-002 · Grade 2')).toBeTruthy();
    expect(screen.getByText('Siap jatah')).toBeTruthy();
    // satu di bendera batch, satu di baris G2
    expect(screen.getAllByText('Perlu Penyiapan')).toHaveLength(2);
    expect(screen.getByText('PK2')).toBeTruthy();
    expect(screen.getByText('800 gr')).toBeTruthy();
    // batch campur grade: baris G1 masih bisa dijatah dan baris G2 masih bisa disiapkan
    expect(screen.getByText('Buat penjatahan')).toBeTruthy();
    expect(screen.getByText('Penyiapan')).toBeTruthy();
  });

  it('does not crash on lines with missing fields', () => {
    mockRations = [
      batch({
        id: 5,
        batch_code: 'B-5',
        lines: [
          { id: 1, item: null },
          { id: 2, item: { id: 9 }, grade: null, gram: null },
        ],
      }),
    ];
    render(<Batches initialTab="jatah" />);
    expect(screen.getAllByText('Tanpa nota').length).toBe(2);
  });

  it('keeps old servers working: no lines, no line section', () => {
    mockRations = [batch({ id: 6, batch_code: 'B-6', grade: 1, ready_for_ration: true })];
    render(<Batches initialTab="jatah" />);
    expect(screen.queryByText('Siap jatah')).toBeNull();
    expect(screen.getByText('Buat penjatahan')).toBeTruthy();
  });
});
