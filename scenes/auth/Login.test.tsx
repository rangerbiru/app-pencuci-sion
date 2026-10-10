import { Linking } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { appActions } from '@/slices/app.slice';
import Login, { forgotPasswordMessage } from './Login';

jest.mock('@/services/session', () => ({
  checkMeta: jest.fn(),
  signIn: jest.fn(() => Promise.resolve({ ok: true })),
}));

function renderLogin(adminWhatsapp: string | null) {
  const r = renderWithProviders(<Login />);
  r.store.dispatch(
    appActions.setMeta({
      updateRequired: false,
      minAppVersion: '1.0.0',
      serverOffsetMs: 0,
      company: { name: 'PT', phone: null, admin_whatsapp: adminWhatsapp },
    }),
  );
  return r;
}

describe('<Login />', () => {
  it('starts empty with an example placeholder and no API address', () => {
    renderLogin('6281234567890');
    const id = screen.getByPlaceholderText('nama@email.com atau 08xx');
    expect(id.props.value).toBe('');
    expect(screen.queryByText(/API:/)).toBeNull();
  });

  it('opens WhatsApp to Admin with the typed email or phone', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    renderLogin('6281234567890');
    fireEvent.changeText(screen.getByPlaceholderText('nama@email.com atau 08xx'), 'siti@sion.id');
    fireEvent.press(await screen.findByText('Hubungi Admin'));
    expect(open).toHaveBeenCalledWith(
      `https://wa.me/6281234567890?text=${encodeURIComponent('Halo Admin, saya siti@sion.id lupa password aplikasi SION.')}`,
    );
  });

  it('tells the user to contact Admin directly when no number is set', async () => {
    renderLogin(null);
    expect(await screen.findByText(/Hubungi Admin langsung/)).toBeTruthy();
    expect(screen.queryByText('Hubungi Admin')).toBeNull();
  });
});

describe('forgotPasswordMessage', () => {
  it('omits the identifier when nothing was typed', () => {
    expect(forgotPasswordMessage('  ')).toBe('Halo Admin, saya lupa password aplikasi SION.');
  });
});
