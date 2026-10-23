import { useLocalSearchParams } from 'expo-router';
import Batches from '@/scenes/batches/Batches';

/** Batch dan penjatahan untuk Kepala Pencuci (batch Mandor atasannya). */
export default function TimBatchRoute() {
  const { tab, batch, assignment } = useLocalSearchParams<{
    tab?: string;
    batch?: string;
    assignment?: string;
  }>();
  return (
    <Batches
      back
      initialTab={tab === 'jatah' ? 'jatah' : undefined}
      highlightBatchId={batch ? Number(batch) : undefined}
      highlightAssignmentId={assignment ? Number(assignment) : undefined}
    />
  );
}
