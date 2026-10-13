import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import useLocation, { LOCATION_TIMEOUT_MS, readLocation } from './useLocation';

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  PermissionStatus: { UNDETERMINED: 'undetermined', DENIED: 'denied', GRANTED: 'granted' },
  hasServicesEnabledAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  enableNetworkProviderAsync: jest.fn(),
}));

const L = Location as jest.Mocked<typeof Location>;
const pos = (latitude: number, longitude: number, accuracy = 20) =>
  ({ coords: { latitude, longitude, accuracy }, timestamp: 0 }) as Location.LocationObject;

beforeEach(() => {
  jest.clearAllMocks();
  L.getCurrentPositionAsync.mockReset();
  L.hasServicesEnabledAsync.mockResolvedValue(true);
  L.getLastKnownPositionAsync.mockResolvedValue(null);
});

describe('readLocation', () => {
  it('reads the position with balanced accuracy', async () => {
    L.getCurrentPositionAsync.mockResolvedValue(pos(-6.2, 106.8));
    await expect(readLocation()).resolves.toEqual({
      status: 'ok',
      coords: { latitude: -6.2, longitude: 106.8 },
      accuracy: 20,
    });
    expect(L.getCurrentPositionAsync).toHaveBeenCalledWith({ accuracy: 3 });
  });

  it('reports GPS off before trying', async () => {
    L.hasServicesEnabledAsync.mockResolvedValue(false);
    await expect(readLocation()).resolves.toEqual({ status: 'gps_off' });
    expect(L.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('gives up after 10 seconds as a weak signal', async () => {
    jest.useFakeTimers();
    L.getCurrentPositionAsync.mockReturnValue(new Promise(() => undefined));
    const p = readLocation();
    await jest.advanceTimersByTimeAsync(LOCATION_TIMEOUT_MS);
    await expect(p).resolves.toEqual({ status: 'weak' });
    jest.useRealTimers();
  });

  it('falls back to a recent last known position', async () => {
    L.getCurrentPositionAsync.mockRejectedValue(new Error('timeout'));
    L.getLastKnownPositionAsync.mockResolvedValue(pos(-6.3, 106.9));
    await expect(readLocation()).resolves.toMatchObject({ status: 'ok' });
  });
});

describe('useLocation', () => {
  it('explains first and asks the system only after the button', async () => {
    L.getForegroundPermissionsAsync.mockResolvedValue({
      granted: false,
      status: 'undetermined',
      canAskAgain: true,
    } as never);
    const { result } = renderHook(() => useLocation());
    await waitFor(() => expect(result.current.state.status).toBe('ask'));
    expect(L.requestForegroundPermissionsAsync).not.toHaveBeenCalled();

    L.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    L.getCurrentPositionAsync.mockResolvedValue(pos(-6.2, 106.8));
    await act(() => result.current.request());
    expect(result.current.state.status).toBe('ok');
  });

  it('shows a denied permission that can only be fixed in Settings', async () => {
    L.getForegroundPermissionsAsync.mockResolvedValue({
      granted: false,
      status: 'denied',
      canAskAgain: false,
    } as never);
    const { result } = renderHook(() => useLocation());
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: 'denied', canAskAgain: false }),
    );
  });
});
