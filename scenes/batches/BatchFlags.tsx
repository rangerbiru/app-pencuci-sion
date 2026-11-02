import { StyleSheet, View } from 'react-native';
import { space } from '@/theme';
import type { ExecutorRole } from '@/types';
import Badge from '@/components/elements/Badge';

export interface BatchFlagsProps {
  grade?: number | null;
  /** jatah dari baris sampingan: tampil "Sampingan" menggantikan grade */
  byproduct?: boolean;
  needsPreparation?: boolean;
  /** jatah yang dibuat gudang diberi penanda "Dari Gudang" */
  executorRole?: ExecutorRole | null;
}

/** Penanda batch/stok/jatah: grade, Perlu Penyiapan, Dari Gudang. Kosong bila tidak ada. */
function BatchFlags({ grade, byproduct, needsPreparation, executorRole }: BatchFlagsProps) {
  const hasGrade = !byproduct && grade !== null && grade !== undefined;
  if (!hasGrade && !byproduct && !needsPreparation && executorRole !== 'gudang') return null;
  return (
    <View style={styles.row}>
      {hasGrade ? <Badge label={`Grade ${grade}`} tone="neutral" icon="tag" /> : null}
      {byproduct ? <Badge label="G3 · Sampingan" tone="neutral" icon="tag" /> : null}
      {needsPreparation ? (
        <Badge label="Perlu Penyiapan" tone="gold" icon="alert-triangle" />
      ) : null}
      {executorRole === 'gudang' ? <Badge label="Dari Gudang" tone="primary" icon="home" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});

export default BatchFlags;
