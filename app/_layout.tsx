import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { loadImages, loadFonts } from '@/theme';
import Provider from '@/providers';

SplashScreen.preventAutoHideAsync();

function Router() {
  useEffect(() => {
    Promise.all([loadImages(), loadFonts()]).finally(() => SplashScreen.hideAsync());
  }, []);

  return (
    <>
      <Slot />
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider>
      <Router />
    </Provider>
  );
}
