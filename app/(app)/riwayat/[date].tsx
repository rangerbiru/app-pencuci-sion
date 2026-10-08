import { useLocalSearchParams } from 'expo-router';
import HistoryDay from '@/scenes/history/HistoryDay';

export default function RiwayatHariRoute() {
  const { date } = useLocalSearchParams<{ date: string }>();
  return <HistoryDay date={date} />;
}
