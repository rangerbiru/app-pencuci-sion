import { useLocalSearchParams } from 'expo-router';
import ApprovalDetail from '@/scenes/approvals/ApprovalDetail';

export default function VerifikasiDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ApprovalDetail id={Number(id)} />;
}
