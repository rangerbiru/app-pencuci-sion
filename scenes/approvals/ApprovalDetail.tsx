import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useToast } from '@/components/elements/Toast';
import { space } from '@/theme';
import {
  toApiError,
  useApproveSubmissionMutation,
  useGetApprovalDetailQuery,
  useRejectSubmissionMutation,
} from '@/services';
import { formatDate, formatDateTime } from '@/utils/date';
import { formatGram, formatPcs } from '@/utils/format';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Button from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import Amount from '@/components/elements/Amount';
import { PhotoThumb } from '@/components/elements/Photo';
import { Dialog, ReasonDialog } from '@/components/elements/Dialog';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';
import { SummaryRow } from '@/scenes/work/SummaryRows';

/** Detail pengajuan: foto besar (ketuk = layar penuh), data, Setujui / Tolak dengan alasan. */
function ApprovalDetail({ id }: { id: number }) {
  const toast = useToast();
  const detail = useGetApprovalDetailQuery(id);
  const s = detail.data;
  const waiting = s?.status.code === 'menunggu';
  const [approve, approveState] = useApproveSubmissionMutation();
  const [reject, rejectState] = useRejectSubmissionMutation();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function doApprove() {
    setError(undefined);
    try {
      await approve(id).unwrap();
      setApproveOpen(false);
      toast.show('Pengajuan disetujui');
      router.back();
    } catch (e) {
      setApproveOpen(false);
      setError(toApiError(e).message);
    }
  }

  async function doReject(reason: string) {
    setError(undefined);
    try {
      await reject({ id, reason }).unwrap();
      setRejectOpen(false);
      toast.show('Pengajuan ditolak');
      router.back();
    } catch (e) {
      const err = toApiError(e);
      setError(err.fieldErrors.reason ?? err.message);
    }
  }

  if (detail.isLoading) {
    return (
      <Screen title="Detail pengajuan" back>
        <SkeletonList rows={3} />
      </Screen>
    );
  }
  if (detail.error && !s) {
    return (
      <Screen title="Detail pengajuan" back>
        <ErrorState error={toApiError(detail.error)} onRetry={detail.refetch} />
      </Screen>
    );
  }
  if (!s) {
    return (
      <Screen title="Detail pengajuan" back>
        <EmptyState
          icon="inbox"
          title="Pengajuan tidak ditemukan"
          actionLabel="Kembali ke Verifikasi"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }
  const photoUrl = s.photo?.url ?? s.photo_url;
  const decidedBy = typeof s.decided_by === 'string' ? s.decided_by : s.decided_by?.name;

  return (
    <Screen
      title={s.worker.name}
      subtitle={s.type.label}
      back
      refreshing={detail.isFetching && !detail.isLoading}
      onRefresh={detail.refetch}
      footer={
        waiting ? (
          <BottomBar>
            <Button
              title="Tolak"
              variant="danger"
              size="large"
              onPress={() => setRejectOpen(true)}
              style={styles.flexHalf}
            />
            <Button
              title="Setujui"
              onPress={doApprove}
              isLoading={approveState.isLoading}
              style={styles.flex}
            />
          </BottomBar>
        ) : undefined
      }>
      <PhotoThumb uri={photoUrl} label={`Foto ${s.type.label} ${s.worker.name}`} wide />
      <Card>
        {s.gram ? (
          <SummaryRow label="Gram">
            <Amount value={s.gram} unit="gram" size="xl" />
          </SummaryRow>
        ) : null}
        <SummaryRow label="Pcs">{s.pcs == null ? '-' : `${formatPcs(s.pcs)} pcs`}</SummaryRow>
        {s.batch_code ? (
          <SummaryRow label="Jatah">{`${s.item}, batch ${s.batch_code}`}</SummaryRow>
        ) : null}
        <SummaryRow label="Tanggal kerja">{formatDate(s.work_date)}</SummaryRow>
        <SummaryRow label="Dikirim">{formatDateTime(s.submitted_at)}</SummaryRow>
        <SummaryRow label="Foto diambil" last>
          {formatDateTime(s.photo?.taken_at ?? s.photo_taken_at)}
        </SummaryRow>
      </Card>
      {s.ration ? (
        <Card>
          <SummaryRow label="Target jatah">{formatGram(s.ration.target_gram)}</SummaryRow>
          <SummaryRow label="Sudah masuk kartu">{formatGram(s.ration.taken_gram)}</SummaryRow>
          {s.ration.pending_other_gram && s.ration.pending_other_gram !== '0.00' ? (
            <SummaryRow label="Pengajuan lain menunggu">
              {formatGram(s.ration.pending_other_gram)}
            </SummaryRow>
          ) : null}
          <SummaryRow label="Sisa sebelum pengajuan ini" last>
            {formatGram(s.ration.remaining_gram)}
          </SummaryRow>
        </Card>
      ) : null}
      {s.rework ? (
        <Card>
          <SummaryRow label="Kerja ulang dari kartu">{formatDate(s.rework.card_date)}</SummaryRow>
          <SummaryRow label="Jumlah kerja ulang" last>
            {s.rework.pcs == null ? '-' : `${formatPcs(s.rework.pcs)} pcs`}
          </SummaryRow>
        </Card>
      ) : null}
      <View style={styles.badges}>
        <Badge status={s.type} kind="work_submission_type" icon="tag" />
        <Badge status={s.status} kind="work_submission" />
      </View>
      {!waiting && decidedBy && s.decided_at ? (
        <Text variant="small" color="textSecondary">
          Diputuskan {decidedBy}, {formatDateTime(s.decided_at)}
          {s.reject_reason ? `. Alasan: ${s.reject_reason}` : ''}
        </Text>
      ) : null}
      {error ? (
        <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Dialog
        visible={approveOpen}
        title="Setujui pengajuan?"
        message={`${s.worker.name}, ${s.type.label}. Masuk Kartu Kerja dan mengurangi sisa jatah.`}
        confirmLabel="Ya, setujui"
        onConfirm={doApprove}
        onCancel={() => setApproveOpen(false)}
        isLoading={approveState.isLoading}
      />
      <ReasonDialog
        recipient="pencuci"
        visible={rejectOpen}
        title="Tolak pengajuan"
        message={`Alasan dikirim ke ${s.worker.name}. Stok dan upah tidak berubah.`}
        confirmLabel="Tolak"
        onSubmit={doReject}
        onCancel={() => setRejectOpen(false)}
        isLoading={rejectState.isLoading}
        serverError={rejectOpen ? error : undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexHalf: { flex: 0.6 },
  badges: { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' },
});

export default ApprovalDetail;
