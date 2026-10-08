import { StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { space } from '@/theme';
import { Submission } from '@/types';
import { formatDateTime, formatTime } from '@/utils/date';
import { formatGram, formatPcs } from '@/utils/format';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import { PhotoThumb } from '@/components/elements/Photo';

/** Satu pengajuan (ambil bahan, serah lembab, kerja ulang) dengan foto. */
function SubmissionRow({
  s,
  showWorker,
  divider = true,
}: {
  s: Submission;
  showWorker?: boolean;
  divider?: boolean;
}) {
  const { colors } = useTheme();
  const qty = [s.gram ? formatGram(s.gram) : null, s.pcs != null ? `${formatPcs(s.pcs)} pcs` : null]
    .filter(Boolean)
    .join(', ');
  const decidedBy = typeof s.decided_by === 'string' ? s.decided_by : s.decided_by?.name;
  return (
    <View
      style={[styles.row, divider && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <PhotoThumb
        uri={s.photo_url}
        label={`Foto ${s.type.label}${showWorker ? ` ${s.worker.name}` : ''}`}
        size={64}
      />
      <View style={styles.main}>
        <Text variant="bodyStrong">{showWorker ? s.worker.name : s.type.label}</Text>
        {showWorker ? (
          <Text variant="small" color="textSecondary">
            {s.type.label}
          </Text>
        ) : null}
        <Text variant="bodyStrong" style={styles.tabular}>
          {qty || '-'}
        </Text>
        {s.batch_code ? (
          <Text variant="small" color="textSecondary">
            {s.item}, batch {s.batch_code}
          </Text>
        ) : null}
        <Text variant="small" color="textSecondary">
          Dikirim jam {formatTime(s.submitted_at)}
        </Text>
        <Badge status={s.status} kind="work_submission" />
        {s.reject_reason ? (
          <Text variant="small" color="danger">
            Ditolak: {s.reject_reason}
          </Text>
        ) : null}
        {decidedBy && s.decided_at ? (
          <Text variant="small" color="textSecondary">
            Diputuskan {decidedBy}, {formatDateTime(s.decided_at)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, paddingVertical: space.md },
  main: { flex: 1, gap: space.xxs },
  tabular: { fontVariant: ['tabular-nums'] },
});

export default SubmissionRow;
