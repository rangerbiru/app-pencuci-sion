import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { appActions, ThemePreference } from '@/slices/app.slice';
import { saveThemePreference } from '@/services/preferences';
import type { Dispatch } from '@/utils/store';

/** Ganti tampilan: langsung berlaku (Redux) lalu disimpan di AsyncStorage. */
export default function useSetThemePreference() {
  const dispatch = useDispatch<Dispatch>();
  return useCallback(
    (value: ThemePreference) => {
      dispatch(appActions.setThemePreference(value));
      saveThemePreference(value);
    },
    [dispatch],
  );
}
