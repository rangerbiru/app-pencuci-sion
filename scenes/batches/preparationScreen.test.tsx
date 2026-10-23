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
jest.mock('@/components/elements/Toast', () => ({ useToast: () => ({ show: jest.fn() }) }));

const mockSubmit = jest.fn();
jest.mock('@/services/fieldActions', () => ({ submitPrepareBatch: (i: unknown) => mockSubmit(i) }));
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
        item: 'Mangkok',
        received_gram: '3000.00',
        received_at: '2026-10-20T09:00:00+07:00',
        remaining_gram: '3000.00',
        can_prepare: true,
        grade: 2,
        needs_preparation: true,
      },
    ],
  }),
  useGetItemsQuery: () => ({
    isLoading: false,
    data: {
      data: [
        {
          id: 9,
          name: 'Sudut Hancur',
          kode: 'SH',
          jenis: { code: 'hasil_produksi', label: 'Hasil produksi' },
          grup_hasil: { code: 'hancur', label: 'Hancur' },
          warna: null,
          unit: 'gr',
        },
      ],
    },
  }),
}));

const sent = (data: object) => ({ status: 'sent', data: { data } });

async function fillAndReview(g1: string) {
  fireEvent.press(screen.getByText('Kering'));
  fireEvent.changeText(screen.getByLabelText('Gram G1'), g1);
  fireEvent.press(screen.getByText('Periksa dan simpan'));
}

jest.setTimeout(20000);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Preparation screen', () => {
  it('shows lost live as a negative number and saves without crushed', async () => {
    mockSubmit.mockResolvedValue(
      sent({
        preparation_id: 1,
        input_gram: '3000.00',
        output_gram: '2880.00',
        susut_gram: '120.00',
        g1_gram: '2880.00',
        crushed_gram: '0.00',
        crushed: [],
        lost_gram: '-120.00',
        lost_percent: '-4.00',
        executor_role: 'mandor',
        batches: [{ id: 15, batch_code: 'B-MB-P1', kode_stok: 'BT1', sent_gram: '2880.00' }],
      }),
    );
    render(<Preparation batchId={14} />);
    fireEvent.changeText(screen.getByLabelText('Gram G1'), '2880');
    expect(screen.getByText(/Hilang\s+−120\s+gr \(−4,0%\)/)).toBeTruthy();
    await fillAndReview('2880');
    // bottom sheet berisi G1, hancur, hilang
    expect(await screen.findByText('Simpan penyiapan?')).toBeTruthy();
    fireEvent.press(screen.getByText('Ya, simpan'));
    await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
    expect(mockSubmit.mock.calls[0][0].body).toMatchObject({ g1_gram: '2880.00', crushed: [] });
    expect(await screen.findByText('Mandor, Pak Joko')).toBeTruthy();
  });

  it('adds a crushed row, counts it, and sends it', async () => {
    mockSubmit.mockResolvedValue({ status: 'queued', item: {} });
    render(<Preparation batchId={14} />);
    fireEvent.press(screen.getByText('Tambah susut hancur'));
    fireEvent.changeText(screen.getByLabelText('Gram hancur'), '80');
    fireEvent.changeText(screen.getByLabelText('Gram G1'), '2800');
    expect(screen.getByText(/Hancur\s+80\s+gr \(2,7%\)/)).toBeTruthy();
    expect(screen.getByText(/Hilang\s+−120\s+gr/)).toBeTruthy();
    fireEvent.press(screen.getByText('Kering'));
    fireEvent.press(screen.getByText('Periksa dan simpan'));
    // item belum dipilih -> pesan di bawah isian, tidak terkirim
    expect(await screen.findByText('Pilih item susut hancur.')).toBeTruthy();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('blocks G1 + crushed above the incoming gram', async () => {
    render(<Preparation batchId={14} />);
    fireEvent.press(screen.getByText('Tambah susut hancur'));
    fireEvent.changeText(screen.getByLabelText('Gram hancur'), '200');
    await fillAndReview('2900');
    expect(await screen.findAllByText(/melebihi gram masuk/)).not.toHaveLength(0);
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});
