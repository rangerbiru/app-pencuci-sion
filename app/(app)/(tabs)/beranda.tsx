import { useAppSlice } from '@/slices';
import WorkerHome from '@/scenes/home/WorkerHome';
import MandorHome from '@/scenes/home/v2/MandorHome';
import PencuciHome from '@/scenes/home/v2/PencuciHome';

/** Beranda per peran. Pencuci dan Mandor memakai layar v2 (Tahap 14C-R2, layar contoh). */
export default function BerandaTab() {
  const { user } = useAppSlice();
  if (user?.role.code === 'mandor') return <MandorHome />;
  if (user?.role.code === 'pencuci') return <PencuciHome />;
  return <WorkerHome />;
}
