import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import useTheme from '@/hooks/useTheme';
import { radius, sizes, space } from '@/theme';
import Text from '../Text';
import Icon from '../Icon';

type ToastTone = 'success' | 'info' | 'error' | 'pending';

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastApi>({ show: () => undefined });

export function useToast() {
  return useContext(ToastContext);
}

/** Toast singkat di atas bilah bawah. Haptic ringan saat berhasil. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);
  const reduce = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    counter.current += 1;
    setToast({ id: counter.current, message, tone });
    if (tone === 'success')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    if (tone === 'error')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), tone === 'error' ? 6000 : 3500);
  }, []);

  const api = useMemo(() => ({ show }), [show]);
  const toneStyle = {
    success: { bg: colors.header, fg: colors.onHeader, icon: 'check-circle' as const },
    info: { bg: colors.header, fg: colors.onHeader, icon: 'info' as const },
    pending: { bg: colors.warningBg, fg: colors.warning, icon: 'upload-cloud' as const },
    error: { bg: colors.dangerBg, fg: colors.danger, icon: 'alert-circle' as const },
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <View
          pointerEvents="none"
          style={[styles.wrap, { bottom: insets.bottom + sizes.primaryButton + space.xxxl }]}>
          <Animated.View
            key={toast.id}
            entering={reduce ? undefined : FadeInDown.duration(180)}
            exiting={reduce ? undefined : FadeOut.duration(150)}
            accessibilityLiveRegion="assertive"
            accessibilityRole="alert"
            style={[styles.toast, { backgroundColor: toneStyle[toast.tone].bg }]}>
            <Icon name={toneStyle[toast.tone].icon} size={20} color={toneStyle[toast.tone].fg} />
            <Text variant="bodyStrong" style={[styles.text, { color: toneStyle[toast.tone].fg }]}>
              {toast.message}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: sizes.gutter, right: sizes.gutter, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.table,
    maxWidth: 480,
    width: '100%',
  },
  text: { flex: 1 },
});
