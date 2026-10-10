import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '@/components/elements/Toast';
import { space } from '@/theme';
import {
  toApiError,
  useApproveTeamWithdrawalMutation,
  useGetTeamWithdrawalsQuery,
  usePayTeamWithdrawalMutation,
  useRejectTeamWithdrawalMutation,
} from '@/services';
import { compressPhoto, Photo } from '@/utils/photo';
import { formatDateTime } from '@/utils/date';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Button from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import Amount from '@/components/elements/Amount';
import Segmented from '@/components/elements/Segmented';
import { PhotoThumb } from '@/components/elements/Photo';
import { Dialog, ReasonDialog } from '@/components/elements/Dialog';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState } from '@/components/elements/StateViews';
import { SummaryRow } from '@/scenes/work/SummaryRows';

/** Proses penarikan Borongan: setujui, tolak dengan alasan, tandai dibayar + foto bukti. */
function TeamWithdrawalDetail({ id, status }: { id: number; status?: string }) {
  const toast = useToast();
  const q = useGetTeamWithdrawalsQuery(status && status !== 'semua' ? { status } : {});
  const all = useGetTeamWithdrawalsQuery({});
  const w = q.data?.data.find(x => x.id === id) ?? all.data?.data.find(x => x.id === id);
  const [approve, approveState] = useApproveTeamWithdrawalMutation();
  const [reject, rejectState] = useRejectTeamWithdrawalMutation();
  const [pay, payState] = usePayTeamWithdrawalMutation();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<'tunai' | 'transfer'>('tunai');
  const [proof, setProof] = useState<Photo | null>(null);
  const [error, setError] = useState<string | undefined>();

  if (!w) {
    return (
      <Screen title="Penarikan" back>
        {q.isLoading || all.isLoading ? (
          <SkeletonList rows={3} />
        ) : (
          <EmptyState
            icon="credit-card"
            title="Penarikan tidak ditemukan"
            actionLabel="Kembali"
            onAction={() => router.back()}
          />
        )}
      </Screen>
    );
  }

  async function run(action: () => Promise<unknown>, message: string) {
    setError(undefined);
    try {
      await action();
      toast.show(message);
      setRejectOpen(false);
      setPayOpen(false);
    } catch (e) {
      const err = toApiError(e);
      setError(err.fieldErrors.reason ?? err.fieldErrors.method ?? err.message);
    }
  }

  async function pickProof(fromCamera: boolean) {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError(
        fromCamera
          ? 'Izin kamera ditolak. Izinkan di Pengaturan HP.'
          : 'Izin galeri ditolak. Izinkan di Pengaturan HP.',
      );
      return;
    }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    setProof(
      await compressPhoto({
        uri: a.uri,
        width: a.width,
        height: a.height,
        takenAt: new Date().toISOString(),
      }),
    );
  }

  const code = w.status.code;

  return (
    <Screen
      title={w.worker?.name ?? 'Penarikan'}
      subtitle="Penarikan dari dana Mandor"
      back
      footer={
        code === 'diajukan' ? (
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
              onPress={() => run(() => approve(w.id).unwrap(), 'Penarikan disetujui')}
              isLoading={approveState.isLoading}
              style={styles.flex}
            />
          </BottomBar>
        ) : code === 'disetujui' ? (
          <BottomBar>
            <Button
              title="Tandai dibayar"
              icon="check"
              onPress={() => setPayOpen(true)}
              style={styles.flex}
            />
          </BottomBar>
        ) : undefined
      }>
      <Card>
        <SummaryRow label="Nominal">
          <Amount value={w.amount} unit="rupiah" size="xl" />
        </SummaryRow>
        <SummaryRow label="Status">
          <Badge status={w.status} kind="withdrawal" />
        </SummaryRow>
        <SummaryRow label="Diajukan">{formatDateTime(w.requested_at)}</SummaryRow>
        {w.approved_at ? (
          <SummaryRow label="Disetujui">{formatDateTime(w.approved_at)}</SummaryRow>
        ) : null}
        {w.paid_at ? (
          <SummaryRow label="Dibayar">{`${formatDateTime(w.paid_at)}${w.method ? `, ${w.method}` : ''}`}</SummaryRow>
        ) : null}
        {w.reject_reason ? <SummaryRow label="Alasan ditolak">{w.reject_reason}</SummaryRow> : null}
        <SummaryRow label="Catatan pencuci" last>
          {w.notes ?? '-'}
        </SummaryRow>
      </Card>
      <Text variant="small" color="textSecondary">
        Pembayaran ini dari dana Mandor dan tidak masuk Buku Kas SION.
      </Text>
      {error ? (
        <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <ReasonDialog
        recipient="pencuci"
        visible={rejectOpen}
        title="Tolak penarikan"
        message="Alasan dikirim ke pencuci."
        confirmLabel="Tolak"
        onSubmit={reason => run(() => reject({ id: w.id, reason }).unwrap(), 'Penarikan ditolak')}
        onCancel={() => setRejectOpen(false)}
        isLoading={rejectState.isLoading}
        serverError={rejectOpen ? error : undefined}
      />
      <Dialog
        visible={payOpen}
        title="Tandai dibayar"
        message="Saldo pencuci berkurang setelah ditandai dibayar."
        confirmLabel="Simpan pembayaran"
        onConfirm={() =>
          run(
            () =>
              pay({
                id: w.id,
                method,
                proof: proof
                  ? { uri: proof.uri, name: 'bukti.jpg', type: 'image/jpeg' }
                  : undefined,
              }).unwrap(),
            'Penarikan ditandai dibayar',
          )
        }
        onCancel={() => setPayOpen(false)}
        isLoading={payState.isLoading}>
        <Section title="Cara bayar">
          <Segmented
            accessibilityLabel="Cara bayar"
            value={method}
            onChange={setMethod}
            options={[
              { value: 'tunai', label: 'Tunai' },
              { value: 'transfer', label: 'Transfer' },
            ]}
          />
        </Section>
        <View style={styles.proof}>
          {proof ? <PhotoThumb uri={proof.uri} label="Foto bukti bayar" size={72} /> : null}
          <View style={styles.flex}>
            <Text variant="smallStrong">Foto bukti (boleh dilewati)</Text>
            <View style={styles.row}>
              <Button
                title="Kamera"
                variant="secondary"
                icon="camera"
                onPress={() => pickProof(true)}
                style={styles.flex}
              />
              <Button
                title="Galeri"
                variant="secondary"
                icon="image"
                onPress={() => pickProof(false)}
                style={styles.flex}
              />
            </View>
          </View>
        </View>
      </Dialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexHalf: { flex: 0.6 },
  proof: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  row: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
});

export default TeamWithdrawalDetail;
