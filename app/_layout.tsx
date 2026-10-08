import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useDispatch } from 'react-redux';
import { loadFonts, loadImages } from '@/theme';
import Provider from '@/providers';
import useAppBootstrap from '@/hooks/useAppBootstrap';
import useTheme from '@/hooks/useTheme';
import { appActions, useAppSlice } from '@/slices';
import { loadThemePreference } from '@/services/preferences';
import type { Dispatch } from '@/utils/store';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Root() {
  useAppBootstrap();
  const dispatch = useDispatch<Dispatch>();
  const { status } = useAppSlice();
  const { colors } = useTheme();
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    // huruf gagal dimuat = pakai huruf sistem, aplikasi tetap jalan.
    // Tampilan dibaca dulu supaya layar pertama tidak berkedip terang lalu gelap.
    Promise.allSettled([
      loadFonts(),
      loadImages(),
      loadThemePreference().then(p => dispatch(appActions.setThemePreference(p))),
    ]).then(() => setAssetsReady(true));
  }, [dispatch]);

  useEffect(() => {
    if (assetsReady && status !== 'checking') SplashScreen.hideAsync().catch(() => undefined);
  }, [assetsReady, status]);

  useEffect(() => {
    // latar di belakang layar (bilah navigasi Android, saat berpindah layar)
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
  }, [colors.background]);

  if (!assetsReady) return null;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      {/* tepi-ke-tepi: latar bilah status = header navy layar (berbeda per mode), ikon terang */}
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider>
      <Root />
    </Provider>
  );
}
