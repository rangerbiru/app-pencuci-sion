import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { loadFonts, loadImages } from '@/theme';
import Provider from '@/providers';
import useAppBootstrap from '@/hooks/useAppBootstrap';
import { useAppSlice } from '@/slices';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Root() {
  useAppBootstrap();
  const { status } = useAppSlice();
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    // huruf gagal dimuat = pakai huruf sistem, aplikasi tetap jalan
    Promise.allSettled([loadFonts(), loadImages()]).then(() => setAssetsReady(true));
  }, []);

  useEffect(() => {
    if (assetsReady && status !== 'checking') SplashScreen.hideAsync().catch(() => undefined);
  }, [assetsReady, status]);

  if (!assetsReady) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
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
