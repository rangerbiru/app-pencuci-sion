import { StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { radius, space } from '@/theme';
import type { Batch, BatchLine } from '@/types';
import { formatGram } from '@/utils/format';
import { batchLines, lineItemName, lineNeedsPreparation, notaText } from '@/utils/batchLines';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';

/** Badge status satu baris: Perlu Penyiapan / Siap jatah / Sudah disiapkan. */
export function LineBadge({ line }: { line: BatchLine }) {
  if (line.prepared) return <Badge label="Sudah disiapkan" tone="neutral" icon="check" />;
  if (lineNeedsPreparation(line)) {
    return <Badge label="Perlu Penyiapan" tone="gold" icon="alert-triangle" />;
  }
  return <Badge label="Siap jatah" tone="accent" icon="check" />;
}

/** "Patahan A · Nota NP-001" */
export function lineTitle(line: BatchLine): string {
  return [lineItemName(line.item), notaText(line.nota)].filter(Boolean).join(' · ');
}

/**
 * Baris batch (revisi 26/10): item, grade, nota, gram, sisa dijatah, dan status. Kosong untuk
 * server lama yang belum mengirim `lines[]`.
 */
function BatchLines({ batch }: { batch: Pick<Batch, 'lines' | 'target_hasil'> }) {
  const { colors } = useTheme();
  const lines = batchLines(batch);
  const target = batch.target_hasil?.trim();
  if (lines.length === 0 && !target) return null;
  return (
    <View style={styles.root}>
      {target ? (
        <Text variant="small" color="textSecondary">
          Target hasil: <Text variant="smallStrong">{target}</Text>
        </Text>
      ) : null}
      {lines.map(line => (
        <View
          key={line.id}
          accessibilityLabel={`${lineTitle(line)}, grade ${line.grade ?? '-'}, ${formatGram(line.gram)}`}
          style={[styles.line, { borderColor: colors.border, opacity: line.prepared ? 0.6 : 1 }]}>
          <View style={styles.head}>
            <Text variant="bodyStrong" style={styles.flex}>
              {lineItemName(line.item)}
            </Text>
            <Text variant="bodyStrong" style={styles.tabular}>
              {formatGram(line.gram)}
            </Text>
          </View>
          <Text variant="small" color="textSecondary">
            {[notaText(line.nota), line.grade != null ? `Grade ${line.grade}` : null]
              .filter(Boolean)
              .join(' · ') || 'Tanpa nota'}
          </Text>
          <View style={styles.foot}>
            <LineBadge line={line} />
            {line.sisa_dijatah != null && !line.prepared ? (
              <Text variant="small" color="textSecondary">
                Sisa dijatah{' '}
                <Text variant="smallStrong" style={styles.tabular}>
                  {formatGram(line.sisa_dijatah)}
                </Text>
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  line: { borderWidth: 1, borderRadius: radius.card, padding: space.md, gap: space.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  foot: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: space.sm,
    rowGap: space.xs,
  },
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
});

export default BatchLines;
