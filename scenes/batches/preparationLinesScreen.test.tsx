import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import Preparation from './Preparation';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
}));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('@/components/layouts/Screen', () => {
  const { View } = jest.requireActual('react-native');
  const { createElement } = jest.requireActual('react');
  return {
    __esModule: true,
    default: ({ children, footer }: { children: unknown; footer?: unknown }) =>
      createElement(View, null, children, footer),
  };
});

const mockSubmit = jest.fn();
jest.mock('@/services/fieldActions', () => ({ submitPrepareBatch: (i: unknown) => mockSubmit(i) }));

const line = (id: number, name: string, nota: string, grade: number, gram: string) => ({
  id,
  item: { id: id + 100, name },
  grade,
  nota,
  gram,
  sisa_dijatah: gram,
  needs_preparation: grade !== 1,
  prepared: false,
});
jest.mock('@/services', () => ({
  toApiError: (e: unknown) => e,
  useGetMeQuery: () => ({ data: { name: 'Pak Joko' } }),
  useGetRationBatchesQuery: () => ({
    isLoading: false,
    error: undefined,
    data: [
      {
        id: 14,
        batch_code: 'B-MB',
        item: 'Patahan A',
        received_gram: '6000.00',
        remaining_gram: '6000.00',
        can_prepare: true,
        grade: 2,
        needs_preparation: true,
        lines: [
          line(31, 'Patahan A', 'NP-001', 2, '2000.00'),
          line(32, 'Patahan B', 'NP-002', 2, '1000.00'),
          line(33, 'Patahan C', 'NP-003', 3, '3000.00'),
        ],
      },
    ],
  }),
  useGetItemsQuery: () => ({
    isLoading: false,
    data: {
      data: [
        {
          id: 7,
          name: 'PK2 Bahan',
          kode: 'PK2',
          jenis: { code: 'bahan_baku', label: 'Bahan baku' },
          grup_hasil: null,
          warna: null,
          unit: 'gr',
        },
        {
          id: 9,
          name: 'Sesetan',
          kode: 'SS',
          jenis: { code: 'sampingan', label: 'Sampingan' },
          grup_hasil: null,
          warna: null,
          unit: 'gr',
        },
      ],
    },
  }),
}));

jest.setTimeout(30000);
beforeEach(() => jest.clearAllMocks());

async function addOutput(index: number, item: string, gram: string) {
  fireEvent.press(screen.getByText('Tambah hasil'));
  fireEvent.press(screen.getAllByText('Pilih item')[0]);
  fireEvent.press(await screen.findByText(item));
  fireEvent.changeText(screen.getAllByLabelText('Gram')[index], gram);
}

describe('Preparation per line', () => {
  it('only allows lines of one grade', () => {
    render(<Preparation batchId={14} />);
    fireEvent.press(screen.getByLabelText(/^Patahan A, Nota NP-001/));
    expect(screen.getByLabelText(/^Patahan C, Nota NP-003/).props.accessibilityState.disabled).toBe(
      true,
    );
    expect(screen.getByLabelText(/^Patahan B, Nota NP-002/).props.accessibilityState.disabled).toBe(
      false,
    );
  });

  it('shows the lost gram live as a negative number', async () => {
    render(<Preparation batchId={14} />);
    fireEvent.press(screen.getByLabelText(/^Patahan A, Nota NP-001/));
    fireEvent.press(screen.getByLabelText(/^Patahan B, Nota NP-002/));
    await addOutput(0, 'PK2 Bahan', '2800');
    expect(screen.getByText(/Hilang\s+−200\s+gr \(−6,7%\)/)).toBeTruthy();
  });

  it('blocks results above the total in and a missing main result', async () => {
    render(<Preparation batchId={14} />);
    fireEvent.press(screen.getByLabelText(/^Patahan A, Nota NP-001/));
    fireEvent.press(screen.getByText('Kering'));
    await addOutput(0, 'PK2 Bahan', '2500');
    fireEvent.press(screen.getByText('Periksa dan simpan'));
    expect(await screen.findAllByText(/melebihi total (gram )?masuk/)).not.toHaveLength(0);
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('asks for a main result when only a byproduct is listed', async () => {
    render(<Preparation batchId={14} />);
    fireEvent.press(screen.getByLabelText(/^Patahan A, Nota NP-001/));
    fireEvent.press(screen.getByText('Kering'));
    fireEvent.press(screen.getByText('Tambah hasil'));
    fireEvent.press(screen.getByLabelText('Sampingan'));
    fireEvent.press(screen.getByText('Pilih item'));
    fireEvent.press(await screen.findByText('Sesetan'));
    fireEvent.changeText(screen.getByLabelText('Gram'), '300');
    fireEvent.press(screen.getByText('Periksa dan simpan'));
    expect(await screen.findByText('Minimal satu hasil utama G1.')).toBeTruthy();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('confirms, sends line_ids + outputs through the offline queue, and shows the new G1 line', async () => {
    mockSubmit.mockResolvedValue({
      status: 'sent',
      data: {
        data: {
          preparation_id: 12,
          input_gram: '3000.00',
          output_gram: '2900.00',
          susut_gram: '100.00',
          lost_gram: '-100.00',
          lost_percent: '-3.33',
          executor_role: 'mandor',
          batches: [],
          outputs: [
            {
              id: 30,
              kode_stok: 'PS-30',
              item: { id: 7, name: 'PK2 Bahan' },
              type: 'main',
              group: null,
              gram: '2500.00',
              pcs: 300,
            },
            {
              id: 31,
              kode_stok: 'PS-31',
              item: { id: 9, name: 'Sesetan' },
              type: 'byproduct',
              group: 'retur',
              gram: '400.00',
              pcs: null,
            },
          ],
          lines: [
            {
              id: 50,
              item: { id: 7, name: 'PK2 Bahan' },
              grade: 1,
              nota: 'NP-001',
              gram: '2500.00',
            },
          ],
        },
      },
    });
    render(<Preparation batchId={14} />);
    fireEvent.press(screen.getByLabelText(/^Patahan A, Nota NP-001/));
    fireEvent.press(screen.getByLabelText(/^Patahan B, Nota NP-002/));
    fireEvent.press(screen.getByText('Kering'));
    await addOutput(0, 'PK2 Bahan', '2500');
    fireEvent.press(screen.getByText('Tambah hasil'));
    fireEvent.press(screen.getAllByLabelText('Sampingan')[1]);
    fireEvent.press(screen.getAllByText('Pilih item')[0]);
    fireEvent.press(await screen.findByText('Sesetan'));
    fireEvent.changeText(screen.getAllByLabelText('Gram')[1], '400');
    fireEvent.press(screen.getAllByLabelText('Retur')[0]);
    fireEvent.press(screen.getByText('Periksa dan simpan'));
    expect(await screen.findByText('Simpan penyiapan?')).toBeTruthy();
    fireEvent.press(screen.getByText('Ya, simpan'));
    await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
    const call = mockSubmit.mock.calls[0][0];
    expect(call.batchId).toBe(14);
    expect(call.body).toMatchObject({
      process_type: 'kering',
      line_ids: [31, 32],
      outputs: [
        { type: 'main', item_id: 7, gram: '2500.00', pcs: null },
        { type: 'byproduct', item_id: 9, gram: '400.00', pcs: null, group: 'retur' },
      ],
    });
    expect(await screen.findByText('Baris G1 baru')).toBeTruthy();
    expect(screen.getByText('PK2 Bahan · Nota NP-001')).toBeTruthy();
    expect(screen.getByText('Mandor, Pak Joko')).toBeTruthy();
  });
});
