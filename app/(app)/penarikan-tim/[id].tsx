import { useLocalSearchParams } from 'expo-router';
import TeamWithdrawalDetail from '@/scenes/teamWithdrawals/TeamWithdrawalDetail';

export default function PenarikanTimDetailRoute() {
  const { id, status } = useLocalSearchParams<{ id: string; status?: string }>();
  return <TeamWithdrawalDetail id={Number(id)} status={status} />;
}
