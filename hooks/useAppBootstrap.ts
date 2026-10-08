import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useDispatch, useStore } from 'react-redux';
import { api } from '@/services/api/api';
import { setUnauthorizedHandler } from '@/services/api/http';
import { configureQueue, initQueue, processQueue, QUEUE_INVALIDATES } from '@/services/queue';
import { isOnline, onOnlineChange, startNetworkWatch } from '@/services/network';
import { bootstrapSession, checkMeta, signOut } from '@/services/session';
import { setQueueItems } from '@/slices/queue.slice';
import type { Dispatch, State } from '@/utils/store';

/**
 * Persiapan saat aplikasi dibuka: cek versi (/meta), pulihkan sesi, pasang antrean kirim ulang,
 * pantau sinyal, dan tangani 401 (keluar ke layar masuk).
 */
export default function useAppBootstrap() {
  const dispatch = useDispatch<Dispatch>();
  const store = useStore<State>();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    configureQueue({
      isOnline,
      currentUser: () => store.getState().app.user?.id ?? null,
      listener: {
        onChange: items => dispatch(setQueueItems(items)),
        onSent: item => dispatch(api.util.invalidateTags(QUEUE_INVALIDATES[item.kind])),
      },
    });

    let loggingOut = false;
    setUnauthorizedHandler(() => {
      if (loggingOut || store.getState().app.status !== 'signedIn') return;
      loggingOut = true;
      signOut(dispatch, { forced: true }).finally(() => {
        loggingOut = false;
      });
    });

    const stopNet = startNetworkWatch();
    const stopOnline = onOnlineChange(online => {
      if (online) processQueue();
    });
    const appState = AppState.addEventListener('change', s => {
      if (s === 'active') processQueue();
    });
    const interval = setInterval(() => processQueue(), 60000);

    (async () => {
      await initQueue();
      await Promise.all([checkMeta(dispatch), bootstrapSession(dispatch)]);
      processQueue();
    })();

    return () => {
      stopNet();
      stopOnline();
      appState.remove();
      clearInterval(interval);
      setUnauthorizedHandler(null);
    };
  }, [dispatch, store]);
}
