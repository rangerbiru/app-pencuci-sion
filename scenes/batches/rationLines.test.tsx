import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import RationForm from './RationForm';
import { validateRations } from './rationForm';
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

const g1a = {
  id: 31,
  item: { id: 5, name: 'Patahan A' },
  grade: 1,
  nota: 'NP-001',
  gram: '1000.00',
  sisa_dijatah: '1000.00',
  needs_preparation: false,
  prepared: false,
};
const g1b = {
  ...g1a,
  id: 33,
  item: { id: 8, name: 'Patahan C' },
  nota: 'NP-003',
  sisa_dijatah: '600.00',
};
const g2 = {
  ...g1a,
  id: 32,
  item: { id: 6, name: 'Patahan B' },
  grade: 2,
  nota: 'NP-002',
  needs_preparation: true,
};
const base = {
  id: 14,
  batch_code: 'B-MB',
  item: 'Patahan A',
  grade: 1,
  remaining_gram: '3000.00',
  ready_for_ration: false,
  needs_preparation: true,
  can_prepare: true,
  assignments: [],
};

jest.setTimeout(20000);
beforeEach(() => jest.clearAllMocks());

describe('RationForm per line', () => {
  it('picks the G1 line first, then the worker, and sends batch_line_id', async () => {
    mockBatch = { ...base, lines: [g1a, g1b, g2] };
    mockCreate.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    render(<RationForm batchId={14} />);
    expect(screen.getByText('Patahan A')).toBeTruthy();
    expect(screen.getByText('Patahan B')).toBeTruthy();
    fireEvent.press(screen.getByText('Siti'));
    fireEvent.changeText(screen.getByPlaceholderText('0'), '500');
    // belum memilih baris: tidak terkirim
    fireEvent.press(screen.getByText('Simpan penjatahan'));
    expect(await screen.findByText('Pilih baris (item dan nota) yang dijatahkan.')).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText(/^Patahan C · Nota NP-003/));
    fireEvent.press(screen.getByText('Simpan penjatahan'));
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(mockCreate.mock.calls[0][0]).toEqual({
      production_batch_id: 14,
      lines: [{ pencuci_id: 5, target_qty: '500.00', batch_line_id: 33 }],
    });
  });

  it('does not let a G2 line be picked', () => {
    mockBatch = { ...base, lines: [g1a, g2] };
    render(<RationForm batchId={14} />);
    const g2Option = screen.getByLabelText(/^Patahan B · Nota NP-002/);
    expect(g2Option.props.accessibilityState.disabled).toBe(true);
    // satu-satunya baris G1 terpilih otomatis
    expect(screen.getByLabelText(/^Patahan A · Nota NP-001/).props.accessibilityState.checked).toBe(
      true,
    );
  });

  it('caps the total at the line sisa_dijatah', async () => {
    mockBatch = { ...base, lines: [g1b] };
    render(<RationForm batchId={14} />);
    fireEvent.press(screen.getByText('Siti'));
    fireEvent.changeText(screen.getByPlaceholderText('0'), '700');
    fireEvent.press(screen.getByText('Simpan penjatahan'));
    expect(await screen.findByText(/melebihi sisa baris/)).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('shows the server message for 422 line_required', async () => {
    mockBatch = { ...base, lines: [g1a, g1b] };
    const msg = 'Batch B-MB berisi 2 baris. Pilih baris (item dan nota) yang dijatahkan.';
    mockCreate.mockReturnValue({
      unwrap: () => Promise.reject(httpError(422, { message: msg, code: 'line_required' })),
    });
    render(<RationForm batchId={14} />);
    fireEvent.press(screen.getByLabelText(/^Patahan A · Nota NP-001/));
    fireEvent.press(screen.getByText('Siti'));
    fireEvent.changeText(screen.getByPlaceholderText('0'), '500');
    fireEvent.press(screen.getByText('Simpan penjatahan'));
    expect(await screen.findByText(msg)).toBeTruthy();
  });

  it('shows the server message and Siapkan dulu for 422 grade_not_ready', async () => {
    mockBatch = { ...base, lines: [g1a, g2] };
    const msg = 'Stok Grade 2/3 harus melalui Penyiapan dulu sebelum dijatahkan ke pencuci.';
    mockCreate.mockReturnValue({
      unwrap: () => Promise.reject(httpError(422, { message: msg, code: 'grade_not_ready' })),
    });
    render(<RationForm batchId={14} />);
    fireEvent.press(screen.getByText('Siti'));
    fireEvent.changeText(screen.getByPlaceholderText('0'), '500');
    fireEvent.press(screen.getByText('Simpan penjatahan'));
    expect(await screen.findByText(msg)).toBeTruthy();
    expect(screen.getAllByText('Siapkan dulu').length).toBeGreaterThan(0);
  });

  it('keeps the old single-line batch working without choosing a line', async () => {
    mockBatch = { ...base, ready_for_ration: true, needs_preparation: false };
    mockCreate.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    render(<RationForm batchId={14} />);
    expect(screen.queryByText('1. Pilih baris G1')).toBeNull();
    fireEvent.press(screen.getByText('Siti'));
    fireEvent.changeText(screen.getByPlaceholderText('0'), '500');
    fireEvent.press(screen.getByText('Simpan penjatahan'));
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(mockCreate.mock.calls[0][0].lines).toEqual([{ pencuci_id: 5, target_qty: '500.00' }]);
  });

  it('blocks a batch with only G2/G3 lines and offers Siapkan dulu', () => {
    mockBatch = { ...base, lines: [g2] };
    render(<RationForm batchId={14} />);
    expect(screen.getByText('Stok belum G1')).toBeTruthy();
    expect(screen.queryByText('Simpan penjatahan')).toBeNull();
  });
});

describe('validateRations with a line', () => {
  it('adds batch_line_id only when a line is chosen', () => {
    expect(validateRations([{ workerId: 5, gram: '100' }], '500.00', 31).lines).toEqual([
      { pencuci_id: 5, target_qty: '100.00', batch_line_id: 31 },
    ]);
    expect(validateRations([{ workerId: 5, gram: '100' }], '500.00').lines).toEqual([
      { pencuci_id: 5, target_qty: '100.00' },
    ]);
  });
});
