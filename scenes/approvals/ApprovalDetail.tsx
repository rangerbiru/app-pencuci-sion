import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useToast } from '@/components/elements/Toast';
import { space } from '@/theme';
import {
  toApiError,
  useApproveSubmissionMutation,
  useGetApprovalsQuery,
  useRejectSubmissionMutation,
} from '@/services';
import { formatDate, formatDateTime } from '@/utils/date';
import { formatPcs } from '@/utils/format';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Button from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import Amount from '@/components/elements/Amount';
import { PhotoThumb } from '@/components/elements/Photo';
import { ReasonDialog } from '@/components/elements/Dialog';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';
import { SummaryRow } from '@/scenes/work/SummaryRows';

/** Detail pengajuan: foto besar (ketuk = layar penuh), data, Setujui / Tolak dengan alasan. */
function ApprovalDetail({ id }: { id: number }) {
  const toast = useToast();
  const approvals = useGetApprovalsQuery();
  const s = approvals.data?.data.find(x => x.id === id);
  const [approve, approveState] = useApproveSubmissionMutation();
  const [reject, rejectState] = useRejectSubmissionMutation();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function doApprove() {
    setError(undefined);
    try {
      await approve(id).unwrap();
      toast.show('Pengajuan disetujui');
      router.back();
    } catch (e) {
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

  if (approvals.isLoading) {
    return (
      <Screen title="Detail pengajuan" back>
        <SkeletonList rows={3} />
      </Screen>
    );
  }
  if (approvals.error) {
    return (
      <Screen title="Detail pengajuan" back>
        <ErrorState error={toApiError(approvals.error)} onRetry={approvals.refetch} />
      </Screen>
    );
  }
  if (!s) {
    return (
      <Screen title="Detail pengajuan" back>
        <EmptyState
          icon="check-circle"
          title="Pengajuan sudah diputuskan"
          message="Pengajuan ini tidak lagi menunggu verifikasi."
          actionLabel="Kembali ke Verifikasi"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={s.worker.name}
      subtitle={s.type.label}
      back
      footer={
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
      }>
      <PhotoThumb uri={s.photo_url} label={`Foto ${s.type.label} ${s.worker.name}`} wide />
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
          {formatDateTime(s.photo_taken_at)}
        </SummaryRow>
      </Card>
      <View style={styles.badges}>
        <Badge status={s.type} kind="work_submission_type" icon="tag" />
        <Badge status={s.status} kind="work_submission" />
      </View>
      {error ? (
        <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <ReasonDialog
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
