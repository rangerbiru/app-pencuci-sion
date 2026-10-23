import { useLocalSearchParams } from 'expo-router';
import Batches from '@/scenes/batches/Batches';

export default function BatchTab() {
  const { tab, batch, assignment } = useLocalSearchParams<{
    tab?: string;
    batch?: string;
    assignment?: string;
  }>();
  return (
    <Batches
      initialTab={tab === 'jatah' ? 'jatah' : undefined}
      highlightBatchId={batch ? Number(batch) : undefined}
      highlightAssignmentId={assignment ? Number(assignment) : undefined}
    />
  );
}
