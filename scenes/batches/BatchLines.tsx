import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { radius, space } from '@/theme';
import type { Batch, BatchLine } from '@/types';
import { formatGram } from '@/utils/format';
import {
  batchLines,
  lineGradeText,
  lineItemName,
  lineName,
  lineNeedsPreparation,
  notaText,
} from '@/utils/batchLines';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Icon from '@/components/elements/Icon';

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
  return [lineName(line), line.stok_gabungan ? null : notaText(line.nota)]
    .filter(Boolean)
    .join(' · ');
}

/** Rincian sumber stok gabungan (item, nota, gram); dibuka dengan ketukan. */
export function Komposisi({ line }: { line: BatchLine }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const rows = line.komposisi ?? [];
  if (!line.stok_gabungan || rows.length === 0) return null;
  return (
    <View>
      <Pressable
        onPress={() => setOpen(o => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Rincian komposisi, ${rows.length} sumber`}
        style={styles.toggle}>
        <Text variant="smallStrong" color="textSecondary" style={styles.flex}>
          Rincian komposisi ({rows.length} sumber)
        </Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </Pressable>
      {open
        ? rows.map((k, i) => (
            <View key={i} style={styles.head}>
              <Text variant="small" style={styles.flex}>
                {[lineItemName(k.item), notaText(k.nota)].filter(Boolean).join(' · ')}
              </Text>
              <Text variant="smallStrong" style={styles.tabular}>
                {formatGram(k.gram)}
              </Text>
            </View>
          ))
        : null}
    </View>
  );
}

/**
 * Baris batch (revisi 26/10): item, grade, nota, gram, sisa dijatah, dan status. Kosong untuk
 * server lama yang belum mengirim `lines[]`.
 */
function BatchLines({
  batch,
}: {
  batch: Pick<Batch, 'lines' | 'target_hasil'> & Partial<Pick<Batch, 'grup_bahan_list'>>;
}) {
  const { colors } = useTheme();
  const lines = batchLines(batch);
  const target = batch.target_hasil?.trim();
  const grups = batch.grup_bahan_list ?? [];
  if (lines.length === 0 && !target && grups.length === 0) return null;
  return (
    <View style={styles.root}>
      {grups.length > 0 ? (
        <View style={styles.foot}>
          {grups.map(g => (
            <Badge key={g.id} label={g.nama} tone="neutral" />
          ))}
        </View>
      ) : null}
      {target ? (
        <Text variant="small" color="textSecondary">
          Target hasil: <Text variant="smallStrong">{target}</Text>
        </Text>
      ) : null}
      {lines.map(line => (
        <View
          key={line.id}
          accessibilityLabel={`${lineTitle(line)}, ${lineGradeText(line) ?? 'tanpa grade'}, ${formatGram(line.gram)}`}
          style={[styles.line, { borderColor: colors.border, opacity: line.prepared ? 0.6 : 1 }]}>
          <View style={styles.head}>
            <Text variant="bodyStrong" style={styles.flex}>
              {lineName(line)}
            </Text>
            <Text variant="bodyStrong" style={styles.tabular}>
              {formatGram(line.gram)}
            </Text>
          </View>
          <Text variant="small" color="textSecondary">
            {[line.stok_gabungan ? null : notaText(line.nota), lineGradeText(line)]
              .filter(Boolean)
              .join(' · ') || 'Tanpa nota'}
          </Text>
          {line.grup_bahan && !line.stok_gabungan ? (
            <Text variant="small" color="textSecondary">
              Grup: <Text variant="smallStrong">{line.grup_bahan.nama}</Text>
            </Text>
          ) : null}
          <Komposisi line={line} />
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
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 32 },
  tabular: { fontVariant: ['tabular-nums'] },
});

export default BatchLines;
