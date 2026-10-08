import { useLocalSearchParams } from 'expo-router';
import ReceiveBatch from '@/scenes/batches/ReceiveBatch';

export default function TerimaBatchRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReceiveBatch batchId={Number(id)} />;
}
