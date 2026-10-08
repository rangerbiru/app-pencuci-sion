import { useLocalSearchParams } from 'expo-router';
import HandOverDamp from '@/scenes/work/HandOverDamp';

export default function KerjaUlangRoute() {
  const { mode, id } = useLocalSearchParams<{ mode?: string; id?: string }>();
  return (
    <HandOverDamp
      mode={mode === 'serah' ? 'serah_kerja_ulang' : 'ambil_kerja_ulang'}
      reworkId={id ? Number(id) : undefined}
    />
  );
}
