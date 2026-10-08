import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * Status jaringan terkini untuk kode di luar komponen (antrean). Komponen memakai useOnline.
 * "Online" = tersambung dan internet tidak dilaporkan tak terjangkau.
 */
let online = true;
const subscribers = new Set<(online: boolean) => void>();

export function computeOnline(state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>) {
  return state.isConnected !== false && state.isInternetReachable !== false;
}

export function isOnline() {
  return online;
}

export function startNetworkWatch(): () => void {
  return NetInfo.addEventListener(state => {
    const next = computeOnline(state);
    if (next === online) return;
    online = next;
    subscribers.forEach(fn => fn(online));
  });
}

export function onOnlineChange(fn: (online: boolean) => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
