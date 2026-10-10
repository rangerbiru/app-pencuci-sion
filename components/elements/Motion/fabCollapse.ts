import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

/** 0 = tombol melayang lengkap dengan label, 1 = hanya ikon (saat menggulir ke bawah). */
export const FabCollapseContext = createContext<SharedValue<number> | null>(null);

export const useFabCollapse = () => useContext(FabCollapseContext);
