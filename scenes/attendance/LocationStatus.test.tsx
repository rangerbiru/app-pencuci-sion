import { fireEvent, render, screen } from '@testing-library/react-native';
import LocationStatus from './LocationStatus';

const actions = {
  onRequest: jest.fn(),
  onRetry: jest.fn(),
  onOpenSettings: jest.fn(),
  onEnableGps: jest.fn(),
};

describe('<LocationStatus />', () => {
  it('offers Settings when permission is permanently denied', () => {
    render(<LocationStatus state={{ status: 'denied', canAskAgain: false }} {...actions} />);
    expect(screen.getByText(/Izin lokasi ditolak/)).toBeTruthy();
    fireEvent.press(screen.getByText('Buka Pengaturan'));
    expect(actions.onOpenSettings).toHaveBeenCalled();
  });

  it('asks to turn GPS on, and retries a weak signal', () => {
    const { rerender } = render(<LocationStatus state={{ status: 'gps_off' }} {...actions} />);
    fireEvent.press(screen.getByText('Nyalakan lokasi'));
    expect(actions.onEnableGps).toHaveBeenCalled();
    rerender(<LocationStatus state={{ status: 'weak' }} {...actions} />);
    expect(screen.getByText(/Sinyal GPS lemah/)).toBeTruthy();
    fireEvent.press(screen.getByText('Coba lagi'));
    expect(actions.onRetry).toHaveBeenCalled();
  });

  it('says the web preview has no location, and absen still works', () => {
    render(<LocationStatus state={{ status: 'web' }} {...actions} />);
    expect(screen.getByText(/tidak tersedia di pratinjau web.*Tanpa lokasi/)).toBeTruthy();
  });

  it('shows inside or outside the work location when the server sent it', () => {
    const ok = { status: 'ok' as const, coords: { latitude: 0, longitude: 0 }, accuracy: 15 };
    const { rerender } = render(
      <LocationStatus state={ok} verdict={{ inside: true, distance: 40 }} {...actions} />,
    );
    expect(screen.getByText('Di lokasi kerja (± 40 m).')).toBeTruthy();
    rerender(
      <LocationStatus state={ok} verdict={{ inside: false, distance: 1112 }} {...actions} />,
    );
    expect(
      screen.getByText(
        'Di luar lokasi (± 1.112\u00a0m). Absen tetap diterima dan Mandor bisa memeriksanya.',
      ),
    ).toBeTruthy();
    rerender(<LocationStatus state={ok} {...actions} />);
    expect(screen.getByText(/akurasi ± 15 m.*Server menentukan/)).toBeTruthy();
  });
});
