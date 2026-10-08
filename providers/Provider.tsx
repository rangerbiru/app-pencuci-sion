import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import useTheme from '@/hooks/useTheme';
import { ToastProvider } from '@/components/elements/Toast';
import store from '@/utils/store';
import 'react-native-reanimated';

function NavigationTheme({ children }: { children: React.ReactNode }) {
  const { isDark, colors } = useTheme();
  const base = isDark ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          background: colors.background,
          card: colors.surface,
          primary: colors.accent,
          text: colors.text,
          border: colors.border,
        },
      }}>
      {children}
    </ThemeProvider>
  );
}

export default function Provider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          <NavigationTheme>
            <ToastProvider>{children}</ToastProvider>
          </NavigationTheme>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
