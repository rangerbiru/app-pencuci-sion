import { useLocalSearchParams } from 'expo-router';
import Preparation from '@/scenes/batches/Preparation';

export default function SiapkanBatchRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Preparation batchId={Number(id)} />;
}
