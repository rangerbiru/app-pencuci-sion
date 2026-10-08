import { useAppSlice } from '@/slices';
import WorkerHome from '@/scenes/home/WorkerHome';
import MandorHome from '@/scenes/home/MandorHome';

export default function BerandaTab() {
  const { user } = useAppSlice();
  return user?.role.code === 'mandor' ? <MandorHome /> : <WorkerHome />;
}
