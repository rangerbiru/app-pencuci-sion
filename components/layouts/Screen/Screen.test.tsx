import { fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { renderWithProviders } from '@/test/render';
import Screen from './Screen';

const err = {
  kind: 'network',
  status: null,
  message: 'Tidak ada sinyal.',
  fieldErrors: {},
} as const;

describe('<Screen />', () => {
  it('keeps old content visible and offers Coba lagi when a refresh failed', () => {
    const onRefresh = jest.fn();
    renderWithProviders(
      <Screen title="Tim" back refreshError={err} onRefresh={onRefresh}>
        <Text>Isi lama</Text>
      </Screen>,
    );
    expect(screen.getByText('Isi lama')).toBeTruthy();
    expect(screen.getByText(/Belum bisa menyegarkan/)).toBeTruthy();
    fireEvent.press(screen.getByText('Coba lagi'));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('shows no banner while data is fresh', () => {
    renderWithProviders(
      <Screen title="Tim" back onRefresh={jest.fn()}>
        <Text>Isi</Text>
      </Screen>,
    );
    expect(screen.queryByText(/Belum bisa menyegarkan/)).toBeNull();
  });
});
