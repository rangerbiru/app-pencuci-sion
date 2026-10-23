import type { ExecutorRole } from '@/types';

/** Label pelaksana jatah/penyiapan; null = tidak tertelusur. */
export function executorLabel(role: ExecutorRole | null | undefined): string | null {
  if (role === 'gudang') return 'Gudang';
  if (role === 'mandor') return 'Mandor';
  return null;
}

/** "Mandor, Pak Joko" / "Gudang" / null */
export function executorText(role: ExecutorRole | null | undefined, name?: string | null) {
  const label = executorLabel(role);
  if (!label) return null;
  return name ? `${label}, ${name}` : label;
}
