import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import RationForm from './RationForm';
import { needsPreparation } from './rationForm';
import { httpError } from '@/services/api/errors';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
}));
jest.mock('@/components/layouts/Screen', () => {
  const { View } = jest.requireActual('react-native');
  const { createElement } = jest.requireActual('react');
  return {
    __esModule: true,
    default: ({ children, footer }: { children: unknown; footer?: unknown }) =>
      createElement(View, null, children, footer),
  };
});
jest.mock('@/components/elements/Toast', () => ({ useToast: () => ({ show: jest.fn() }) }));

const mockCreate = jest.fn();
let mockBatch: Record<string, unknown>;
jest.mock('@/services', () => ({
  toApiError: (e: unknown) => e,
  useGetRationBatchesQuery: () => ({ data: [mockBatch], isLoading: false, error: undefined }),
  useGetTeamQuery: () => ({
    data: [{ id: 5, name: 'Siti', role: { code: 'pencuci', label: 'Pencuci' } }],
    isLoading: false,
    error: undefined,
  }),
  useCreateRationsMutation: () => [mockCreate, { isLoading: false }],
}));

const base = {
  id: 14,
  batch_code: 'B-MB',
  item: 'Mangkok',
  remaining_gram: '1000.00',
  assignments: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('needsPreparation', () => {
  it('follows the server flags and treats old servers as ready', () => {
    expect(needsPreparation({ ready_for_ration: false })).toBe(true);
    expect(needsPreparation({ needs_preparation: true })).toBe(true);
    expect(needsPreparation({ ready_for_ration: true, needs_preparation: false })).toBe(false);
    expect(needsPreparation({})).toBe(false);
  });
});

describe('RationForm grade gate', () => {
  it('lets a G1 batch be rationed and shows its grade', () => {
    mockBatch = { ...base, grade: 1, ready_for_ration: true, needs_preparation: false };
    render(<RationForm batchId={14} />);
    expect(screen.getByText('Grade 1')).toBeTruthy();
    expect(screen.getByText('Simpan penjatahan')).toBeTruthy();
    expect(screen.queryByText('Perlu Penyiapan')).toBeNull();
  });

  it('rejects a G2 batch up front with a Siapkan dulu button', () => {
    mockBatch = {
      ...base,
      grade: 2,
      ready_for_ration: false,
      needs_preparation: true,
      can_prepare: true,
    };
    render(<RationForm batchId={14} />);
    expect(screen.getByText('Perlu Penyiapan')).toBeTruthy();
    expect(screen.queryByText('Simpan penjatahan')).toBeNull();
    fireEvent.press(screen.getByText('Siapkan dulu'));
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/batch/siapkan/[id]',
      params: { id: '14' },
    });
  });

  it('shows the server message and Siapkan dulu on 422 grade_not_ready, not a generic error', async () => {
    mockBatch = { ...base, grade: 1, ready_for_ration: true, can_prepare: true };
    const msg = 'Stok Grade 2/3 harus melalui Penyiapan dulu sebelum dijatahkan ke pencuci.';
    mockCreate.mockReturnValue({
      unwrap: () => Promise.reject(httpError(422, { message: msg, code: 'grade_not_ready' })),
    });
    render(<RationForm batchId={14} />);
    fireEvent.press(screen.getByText('Siti'));
    fireEvent.changeText(screen.getByPlaceholderText('0'), '500');
    fireEvent.press(screen.getByText('Simpan penjatahan'));
    await waitFor(() => expect(screen.getByText(msg)).toBeTruthy());
    expect(screen.getByText('Siapkan dulu')).toBeTruthy();
    expect(screen.queryByText('Ada isian yang belum benar.')).toBeNull();
  });
});

describe('httpError code', () => {
  it('keeps the machine code and stays absent for plain 422s', () => {
    expect(httpError(422, { message: 'x', code: 'grade_not_ready' }).code).toBe('grade_not_ready');
    expect(httpError(422, { message: 'x' })).not.toHaveProperty('code');
  });
});
