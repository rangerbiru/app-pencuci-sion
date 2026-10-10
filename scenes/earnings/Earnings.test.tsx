import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { Balance, Earnings as EarningsData } from '@/types';
import Earnings from './Earnings';

jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));

const earnings: EarningsData = {
  week: '2026-W38',
  from: '2026-09-14',
  to: '2026-09-20',
  finished: true,
  paid_by: { code: 'sion', label: 'Dibayar SION' },
  present_days: 6,
  material_gram: '250.00',
  upah_bahan: '0.00',
  upah_hasil: '0.00',
  upah_qc: '0.00',
  upah_by_status: { tertahan: '0.10', belum_dihitung: '0.20', sudah_dihitung: '31520200.00' },
  gaji_harian: '180000.00',
  bonus_mingguan: {
    status: { code: 'capai', label: 'Capai' },
    amount: '100000.00',
    achieved_gram: '250.00',
    target_gram: '240.00',
    finished: true,
  },
  // nilai yang tidak bisa dipegang float dengan tepat
  total: '9007199254740993.01',
  days: [],
};

const balance = {
  paid_by: { code: 'sion', label: 'Dibayar SION' },
  dapat_dicairkan: '280000.00',
  pending: '100000.00',
  thr_ditahan: '22400.00',
  thr_by_contract_year: [],
  pending_items: [],
  ledger: [],
  withdrawal: { can_withdraw: true, min_amount: '50000.00', active: null },
} as Balance;

const q = <T,>(data: T) => ({
  data,
  isLoading: false,
  isFetching: false,
  error: undefined,
  refetch: jest.fn(),
});

jest.mock('@/services', () => ({
  toApiError: jest.fn(),
  useGetEarningsQuery: () => q(earnings),
  useGetBalanceQuery: () => q(balance),
  useGetMyDailyProfitQuery: () => q({ data: [], meta: { from: '', to: '' } }),
  useGetUnreadCountQuery: () => q(0),
}));

describe('<Earnings /> Pendapatan', () => {
  it('shows money strings from the API as-is (formatted, never recalculated)', () => {
    renderWithProviders(<Earnings />);
    expect(screen.getByLabelText('Rp\u00a09.007.199.254.740.993,01')).toBeTruthy();
    expect(screen.getByTestId('money-Upah sudah dihitung')).toHaveTextContent('Rp\u00a031.520.200');
    expect(screen.getByTestId('money-Upah tertahan')).toHaveTextContent('Rp\u00a00,10');
    expect(screen.getByTestId('money-Upah belum dihitung')).toHaveTextContent('Rp\u00a00,20');
    expect(screen.getByTestId('money-Total')).toHaveTextContent('Rp\u00a09.007.199.254.740.993,01');
  });

  it('shows the balance buckets with glossary names', () => {
    renderWithProviders(<Earnings />);
    expect(screen.getByTestId('money-Saldo Dapat Dicairkan')).toHaveTextContent('Rp\u00a0280.000');
    expect(screen.getByTestId('money-Bonus Pending')).toHaveTextContent('Rp\u00a0100.000');
    expect(screen.getByTestId('money-THR Ditahan')).toHaveTextContent('Rp\u00a022.400');
    expect(screen.getAllByText('Capai').length).toBeGreaterThan(0);
  });

  it('shows the withdrawable balance in the hero card with a Tarik dana action', () => {
    renderWithProviders(<Earnings />);
    expect(screen.getByText('Saldo dapat dicairkan')).toBeTruthy();
    expect(screen.getByLabelText('Rp\u00a0280.000')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tarik dana' })).toBeTruthy();
  });
});
