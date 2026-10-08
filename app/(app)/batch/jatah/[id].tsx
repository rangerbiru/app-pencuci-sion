import { useLocalSearchParams } from 'expo-router';
import RationForm from '@/scenes/batches/RationForm';

export default function JatahRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RationForm batchId={Number(id)} />;
}
