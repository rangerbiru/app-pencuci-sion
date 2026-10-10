import { useAppSlice } from '@/slices';
import WorkerHome from '@/scenes/home/WorkerHome';
import KepalaHome from '@/scenes/home/v2/KepalaHome';
import { flags } from '@/utils/config';
import MandorHome from '@/scenes/home/v2/MandorHome';
import PencuciHome from '@/scenes/home/v2/PencuciHome';

/** Beranda per peran. semua v2 (Tahap 14C-R2). */
export default function BerandaTab() {
  const { user } = useAppSlice();
  if (user?.role.code === 'mandor') return <MandorHome />;
  if (user?.role.code === 'pencuci') return <PencuciHome />;
  // Kepala ikut mencuci (flag menyala) memakai Beranda dengan langkah kerja
  if (user?.role.code === 'kepala_pencuci' && !flags.kepalaWashing) return <KepalaHome />;
  return <WorkerHome />;
}
