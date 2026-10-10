import { memo, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { radius, space } from '@/theme';
import { Submission } from '@/types';
import { formatDate, formatDateTime, formatTime } from '@/utils/date';
import { formatGram, formatPcs } from '@/utils/format';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Icon from '@/components/elements/Icon';
import Image from '@/components/elements/Image';
import { PhotoThumb } from '@/components/elements/Photo';
import { AccordionItem } from '@/components/elements/Accordion';

/** "Ambil Bahan" -> "Ambil bahan" (kalimat biasa). */
function sentence(label: string) {
  return label.charAt(0) + label.slice(1).toLowerCase();
}

export function submissionQuantity(s: Submission): string {
  return (
    [s.gram ? formatGram(s.gram) : null, s.pcs != null ? `${formatPcs(s.pcs)} pcs` : null]
      .filter(Boolean)
      .join(', ') || '-'
  );
}

/** Judul baris tertutup: "Ambil bahan, 250 gr, 30 pcs" (dengan nama pencuci di antrean). */
export function submissionTitle(s: Submission, showWorker = false): string {
  const what = `${sentence(s.type.label)}, ${submissionQuantity(s)}`;
  return showWorker ? `${s.worker.name}: ${what}` : what;
}

function Fact({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={styles.fact}>
      <Text type="small" color="textSecondary" style={styles.factLabel}>
        {label}
      </Text>
      <Text type="small" color={danger ? 'danger' : 'text'} style={styles.factValue}>
        {value}
      </Text>
    </View>
  );
}

export interface SubmissionItemProps {
  s: Submission;
  open: boolean;
  onToggle: () => void;
  /** antrean Verifikasi: nama pencuci di judul dan tanggal kerja di keterangan */
  showWorker?: boolean;
  divider?: boolean;
  /** isi kiri sebelum foto, mis. kotak centang pilih banyak */
  leading?: ReactNode;
  /** tombol di dalam rincian, mis. Setujui / Tolak */
  actions?: ReactNode;
  /** antrean yang semuanya Menunggu: badge status tidak perlu (memberi ruang ke judul) */
  hideStatus?: boolean;
}

/**
 * Kartu pengajuan ringkas (v2): tertutup = foto 40 dp, jenis + jumlah, badge status, jam.
 * Ketuk untuk rincian: batch dan item, siapa memutuskan dan kapan, alasan tolak, foto besar yang
 * bisa diperbesar. Memakai Accordion yang sama dengan layar lain. Tidak ada geser-untuk-setuju.
 */
function SubmissionItem({
  s,
  open,
  onToggle,
  showWorker = false,
  divider = true,
  leading,
  actions,
  hideStatus = false,
}: SubmissionItemProps) {
  const { colors } = useTheme();
  const decidedBy = typeof s.decided_by === 'string' ? s.decided_by : s.decided_by?.name;
  const when = showWorker
    ? `${formatDate(s.work_date)}, jam ${formatTime(s.submitted_at)}`
    : `Jam ${formatTime(s.submitted_at)}`;
  return (
    <AccordionItem
      open={open}
      onToggle={onToggle}
      divider={divider}
      accessibilityLabel={`${submissionTitle(s, showWorker)}. ${s.status.label}. ${when}`}
      header={
        <>
          {leading}
          {s.photo_url ? (
            <Image
              source={{ uri: s.photo_url }}
              style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={[styles.thumb, styles.noPhoto, { backgroundColor: colors.surfaceSunken }]}>
              <Icon name="image" size={16} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.flex}>
            <Text type="bodyStrong" numberOfLines={2}>
              {submissionTitle(s, showWorker)}
            </Text>
            <Text type="small" color="textSecondary">
              {when}
            </Text>
          </View>
          {hideStatus ? null : <Badge status={s.status} kind="work_submission" />}
        </>
      }>
      <View style={styles.body}>
        {s.batch_code ? <Fact label="Batch" value={`${s.batch_code}, ${s.item ?? '-'}`} /> : null}
        <Fact label="Tanggal kerja" value={formatDate(s.work_date)} />
        <Fact label="Dikirim" value={formatDateTime(s.submitted_at)} />
        {s.photo_taken_at ? (
          <Fact label="Foto diambil" value={formatDateTime(s.photo_taken_at)} />
        ) : null}
        {decidedBy && s.decided_at ? (
          <Fact label="Diputuskan" value={`${decidedBy}, ${formatDateTime(s.decided_at)}`} />
        ) : null}
        {s.reject_reason ? <Fact label="Alasan ditolak" value={s.reject_reason} danger /> : null}
        <PhotoThumb uri={s.photo_url} label={`Foto ${s.type.label} ${s.worker.name}`} wide />
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
    </AccordionItem>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  thumb: { width: 40, height: 40, borderRadius: radius.tile - 4 },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  body: { gap: space.sm },
  fact: { flexDirection: 'row', gap: space.md },
  factLabel: { width: 104 },
  factValue: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
});

export default memo(SubmissionItem);
