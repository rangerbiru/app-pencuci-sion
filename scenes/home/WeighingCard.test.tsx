import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { submitWeighing } from '@/services/fieldActions';
import { WorkCard } from '@/types';
import WeighingCard from './WeighingCard';

jest.mock('@/services/fieldActions', () => ({ submitWeighing: jest.fn() }));
jest.mock('expo-image', () => ({ Image: () => null }));

const submitMock = submitWeighing as jest.MockedFunction<typeof submitWeighing>;

const card = {
  id: 88,
  work_date: '2026-09-24',
  worker: { id: 7, name: 'Siti' },
  result: {
    gram: '12156.00',
    groups: [
      { group: 'utuh', gram: '8518.00', pcs: 0 },
      { group: 'kecil', gram: '900.00', pcs: 0 },
    ],
    rows: [],
  },
  weighing_confirmation: {
    status: { code: 'menunggu', label: 'Menunggu' },
    requested_at: '2026-09-24T10:00:00+07:00',
    deadline: '2099-01-01T10:00:00+07:00',
    answered_at: null,
    reason: null,
  },
} as unknown as WorkCard;

describe('<WeighingCard /> konfirmasi hasil timbang', () => {
  beforeEach(() => submitMock.mockReset());

  it('shows the result, the API status label, and the time left', () => {
    renderWithProviders(<WeighingCard card={card} />);
    expect(screen.getByText('Menunggu')).toBeTruthy();
    expect(screen.getByText('8.518\u00a0gr')).toBeTruthy();
    expect(screen.getByText(/dianggap setuju otomatis/)).toBeTruthy();
  });

  it('sends agree after confirmation', async () => {
    submitMock.mockResolvedValue({ status: 'sent', data: { data: card } });
    const onAnswered = jest.fn();
    renderWithProviders(<WeighingCard card={card} onAnswered={onAnswered} />);
    fireEvent.press(screen.getByRole('button', { name: 'Setuju' }));
    fireEvent.press(screen.getByRole('button', { name: 'Ya, setuju' }));
    await waitFor(() =>
      expect(submitMock).toHaveBeenCalledWith({ cardId: 88, agree: true, reason: undefined }),
    );
    await waitFor(() => expect(onAnswered).toHaveBeenCalled());
  });

  it('requires a reason of at least 5 characters to disagree', async () => {
    submitMock.mockResolvedValue({ status: 'sent', data: { data: card } });
    renderWithProviders(<WeighingCard card={card} />);
    fireEvent.press(screen.getByRole('button', { name: 'Tidak setuju' }));
    fireEvent.press(screen.getByRole('button', { name: 'Kirim keberatan' }));
    expect(await screen.findByText('Tulis alasan minimal 5 huruf.')).toBeTruthy();
    expect(submitMock).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('Alasan'), 'Gram utuh kurang');
    fireEvent.press(screen.getByRole('button', { name: 'Kirim keberatan' }));
    await waitFor(() =>
      expect(submitMock).toHaveBeenCalledWith({
        cardId: 88,
        agree: false,
        reason: 'Gram utuh kurang',
      }),
    );
  });
});
