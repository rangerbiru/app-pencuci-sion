import { Redirect } from 'expo-router';

/** Tautan yang tidak dikenal kembali ke layar awal. */
export default function NotFound() {
  return <Redirect href="/" />;
}
