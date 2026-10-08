import { Redirect, Stack } from 'expo-router';
import { useAppSlice } from '@/slices';

/** Semua layar di sini butuh sesi masuk. */
export default function SignedInLayout() {
  const { status, updateRequired } = useAppSlice();
  if (updateRequired) return <Redirect href="/perbarui" />;
  if (status === 'checking') return null;
  if (status === 'signedOut') return <Redirect href="/masuk" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
