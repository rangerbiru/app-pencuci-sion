import { Redirect } from 'expo-router';
import { useAppSlice } from '@/slices';

export default function Index() {
  const { status, updateRequired } = useAppSlice();
  if (updateRequired) return <Redirect href="/perbarui" />;
  if (status === 'checking') return null;
  if (status === 'signedOut') return <Redirect href="/masuk" />;
  return <Redirect href="/beranda" />;
}
