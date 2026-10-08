import { useLocalSearchParams } from 'expo-router';
import WorkCardDetail from '@/scenes/workCards/WorkCardDetail';

export default function KartuDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WorkCardDetail id={Number(id)} />;
}
