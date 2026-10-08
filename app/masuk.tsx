import { Redirect } from 'expo-router';
import { useAppSlice } from '@/slices';
import Login from '@/scenes/auth/Login';

export default function MasukRoute() {
  const { status, updateRequired } = useAppSlice();
  if (updateRequired) return <Redirect href="/perbarui" />;
  if (status === 'signedIn') return <Redirect href="/beranda" />;
  return <Login />;
}
