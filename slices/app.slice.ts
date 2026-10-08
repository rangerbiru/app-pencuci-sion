import { useDispatch, useSelector } from 'react-redux';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { State, Dispatch } from '@/utils/store';
import { Me, Meta } from '@/types';

export type AuthStatus = 'checking' | 'signedOut' | 'signedIn';

/** Tampilan: terang (bawaan, ruang cuci terang), gelap, atau ikuti sistem. */
export type ThemePreference = 'light' | 'dark' | 'system';

export interface AppState {
  status: AuthStatus;
  user?: Me;
  /** true bila versi aplikasi di bawah min_app_version dari /meta */
  updateRequired: boolean;
  minAppVersion?: string;
  /** selisih jam server - jam HP (ms), dari /meta */
  serverOffsetMs: number;
  /** pesan sekali tampil di layar masuk, mis. "Sesi Anda berakhir" */
  loginNotice?: string;
  themePreference: ThemePreference;
  /** dari /meta; null/undefined = tombol Hubungi Admin disembunyikan */
  company?: Meta['company'];
  settings?: Meta['settings'];
}

const initialState: AppState = {
  status: 'checking',
  user: undefined,
  updateRequired: false,
  serverOffsetMs: 0,
  themePreference: 'light',
};

const slice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    signedIn: (state, { payload }: PayloadAction<Me>) => {
      state.status = 'signedIn';
      state.user = payload;
      state.loginNotice = undefined;
    },
    signedOut: (state, { payload }: PayloadAction<string | undefined>) => {
      state.status = 'signedOut';
      state.user = undefined;
      state.loginNotice = payload;
    },
    setThemePreference: (state, { payload }: PayloadAction<ThemePreference>) => {
      state.themePreference = payload;
    },
    setUser: (state, { payload }: PayloadAction<Me>) => {
      state.user = payload;
    },
    setMeta: (
      state,
      {
        payload,
      }: PayloadAction<{
        updateRequired: boolean;
        minAppVersion: string;
        serverOffsetMs: number;
        company?: Meta['company'];
        settings?: Meta['settings'];
      }>,
    ) => {
      state.company = payload.company;
      state.settings = payload.settings;
      state.updateRequired = payload.updateRequired;
      state.minAppVersion = payload.minAppVersion;
      state.serverOffsetMs = payload.serverOffsetMs;
    },
  },
});

export const appActions = slice.actions;

export function useAppSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector(({ app }: State) => app);
  return { dispatch, ...state, ...slice.actions };
}

export default slice.reducer;
