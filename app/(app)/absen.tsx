import { useLocalSearchParams } from 'expo-router';
import AttendanceCapture from '@/scenes/attendance/AttendanceCapture';

export default function AbsenRoute() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  return <AttendanceCapture mode={mode === 'pulang' ? 'pulang' : 'masuk'} />;
}
