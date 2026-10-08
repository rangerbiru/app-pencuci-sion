import { ReactElement } from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { ToastProvider } from '@/components/elements/Toast';
import { appActions } from '@/slices/app.slice';
import { makeStore } from '@/utils/store';
import { Me } from '@/types';

export const pencuci: Me = {
  id: 7,
  name: 'Siti',
  email: 'siti@sion.test',
  phone: '081234567890',
  role: { code: 'pencuci', label: 'Pencuci' },
  photo_url: null,
  kepala_pencuci: { id: 5, name: 'Bu Kepala' },
  mandor: { id: 3, name: 'Pak Mandor' },
  location: { id: 1, name: 'BEST - Jasa Pencucian' },
  contract: null,
};

/** Render dengan Redux store baru dan ToastProvider (seperti aplikasi). */
export function renderWithProviders(ui: ReactElement, { user = pencuci }: { user?: Me } = {}) {
  const store = makeStore();
  store.dispatch(appActions.signedIn(user));
  return {
    store,
    ...render(<Provider store={store}>{<ToastProvider>{ui}</ToastProvider>}</Provider>),
  };
}
