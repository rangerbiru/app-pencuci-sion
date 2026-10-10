import { useContext, useEffect, useRef } from 'react';
import { NavigationContext } from '@react-navigation/native';

/**
 * Jalankan `onFocus` setiap layar ini mendapat fokus (dan `onBlur` saat kehilangan fokus).
 * Aman di luar navigator (mis. test komponen): tidak melakukan apa-apa.
 */
export default function useOnFocus(onFocus: () => void, onBlur?: () => void) {
  const navigation = useContext(NavigationContext);
  const focusRef = useRef(onFocus);
  const blurRef = useRef(onBlur);
  focusRef.current = onFocus;
  blurRef.current = onBlur;
  useEffect(() => {
    if (!navigation) return;
    if (navigation.isFocused()) focusRef.current();
    const offFocus = navigation.addListener('focus', () => focusRef.current());
    const offBlur = navigation.addListener('blur', () => blurRef.current?.());
    return () => {
      offFocus();
      offBlur();
    };
  }, [navigation]);
}
