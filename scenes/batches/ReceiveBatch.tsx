import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import useFieldSubmit from '@/hooks/useFieldSubmit';
import { space } from '@/theme';
import { Container } from '@/types';
import {
  containerCodeFromScan,
  fetchContainer,
  toApiError,
  useGetIncomingBatchesQuery,
} from '@/services';
import { submitReceiveBatch } from '@/services/fieldActions';
import { isFeatureEnabled } from '@/utils/config';
import { formatGram } from '@/utils/format';
import { Photo } from '@/utils/photo';
import Screen from '@/components/layouts/Screen';
import CameraCapture from '@/components/elements/CameraCapture';
import QrScanner from '@/components/elements/QrScanner';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import TextField from '@/components/elements/TextField';
import { GramInput, PcsInput } from '@/components/elements/NumberInput';
import Button from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import Badge from '@/components/elements/Badge';
import Amount from '@/components/elements/Amount';
import Icon from '@/components/elements/Icon';
import { PhotoThumb } from '@/components/elements/Photo';
import { SkeletonDetail } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';
import { SummaryRow } from '@/scenes/work/SummaryRows';
import {
  ReceiveErrors,
  ReceiveInput,
  ReceiveValues,
  validateReceiveBatch,
} from './receiveBatchForm';

type Step = 'form' | 'scan' | 'photo' | 'summary';

/** Terima batch: gram dan pcs diterima (bisa lewat scan QR wadah), foto, catatan selisih. */
function ReceiveBatch({ batchId }: { batchId: number }) {
  const { colors } = useTheme();
  const incoming = useGetIncomingBatchesQuery();
  const batch = incoming.data?.find(b => b.id === batchId);
  const { submit, submitting, error } = useFieldSubmit();
  const [step, setStep] = useState<Step>('form');
  const [input, setInput] = useState<ReceiveInput>({
    gram: '',
    bruto: '',
    tare: '',
    tareReason: '',
    pcs: '',
    notes: '',
  });
  const [errors, setErrors] = useState<ReceiveErrors>({});
  const [container, setContainer] = useState<Container | null>(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [values, setValues] = useState<ReceiveValues | null>(null);

  const set = (k: keyof ReceiveInput) => (v: string) => setInput(prev => ({ ...prev, [k]: v }));

  if (incoming.isLoading) {
    return (
      <Screen title="Terima batch" back>
        <SkeletonDetail facts={4} photo={false} />
      </Screen>
    );
  }
  if (incoming.error) {
    return (
      <Screen title="Terima batch" back>
        <ErrorState error={toApiError(incoming.error)} onRetry={incoming.refetch} />
      </Screen>
    );
  }
  if (!batch) {
    return (
      <Screen title="Terima batch" back>
        <EmptyState
          icon="package"
          title="Batch sudah diterima atau tidak ada"
          message="Batch ini tidak lagi menunggu diterima."
          actionLabel="Kembali ke Batch"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  async function onScan(raw: string) {
    setScanBusy(true);
    setScanError(null);
    const res = await fetchContainer(containerCodeFromScan(raw));
    setScanBusy(false);
    if (!res.ok) {
      setScanError(
        res.error.status === 404 ? 'Wadah tidak ditemukan. Periksa kodenya.' : res.error.message,
      );
      return;
    }
    if (!res.data.data.usable) {
      setScanError(
        `Wadah ${res.data.data.kode} berstatus ${res.data.data.status.label} dan tidak boleh dipakai menimbang.`,
      );
      return;
    }
    setContainer(res.data.data);
    setInput(prev => ({ ...prev, tare: '', tareReason: '' }));
    setStep('form');
  }

  function review() {
    if (!batch) return;
    const res = validateReceiveBatch(input, batch.sent_gram, container);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    setErrors({});
    setValues(res.values);
    setStep('summary');
  }

  async function send() {
    if (!batch || !values) return;
    const outcome = await submit(
      () =>
        submitReceiveBatch({
          batchId: batch.id,
          batchCode: batch.batch_code,
          receivedGram: values.receivedGram,
          receivedPcs: values.receivedPcs,
          notes: values.notes,
          photo,
          container: values.container,
        }),
      'Batch diterima',
    );
    if (outcome.status === 'rejected') {
      const fe = outcome.error.fieldErrors;
      setErrors({
        gram: fe.received_qty,
        pcs: fe.received_pcs,
        notes: fe.receipt_notes,
        tareReason: fe['container.tare_reason'],
        bruto: fe['container.bruto'],
      });
      setStep('form');
      return;
    }
    router.back();
  }

  if (step === 'scan') {
    return (
      <Screen title="Scan QR wadah" back>
        <QrScanner onCode={onScan} busy={scanBusy} />
        {scanError ? (
          <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
            {scanError}
          </Text>
        ) : null}
        <Button title="Batal, isi gram langsung" variant="ghost" onPress={() => setStep('form')} />
      </Screen>
    );
  }

  if (step === 'photo') {
    return (
      <Screen title="Foto batch diterima" back scroll={false} padded={false}>
        <CameraCapture
          facing="back"
          guide="document"
          hint="Foto batch di timbangan atau wadahnya."
          onConfirm={p => {
            setPhoto(p);
            setStep('summary');
          }}
        />
      </Screen>
    );
  }

  if (step === 'summary' && values) {
    return (
      <Screen
        title="Terima batch"
        subtitle="Periksa sebelum kirim"
        back
        footer={
          <BottomBar>
            <Button
              title="Ubah"
              variant="secondary"
              size="large"
              onPress={() => setStep('form')}
              style={styles.flexHalf}
            />
            <Button
              title="Terima batch"
              onPress={send}
              isLoading={submitting}
              style={styles.flex}
            />
          </BottomBar>
        }>
        <Card>
          <SummaryRow label="Gram diterima">
            <Amount value={values.receivedGram} unit="gram" size="xl" />
          </SummaryRow>
          <SummaryRow label="Gram dikirim">{formatGram(batch.sent_gram)}</SummaryRow>
          <SummaryRow label="Selisih (susut penerimaan)">
            {formatGram(values.shrinkGram)}
          </SummaryRow>
          <SummaryRow label="Pcs">
            {values.receivedPcs === null ? '-' : `${values.receivedPcs} pcs`}
          </SummaryRow>
          {values.container ? (
            <SummaryRow label="Wadah">{`${values.container.container_code}, bruto ${formatGram(values.container.bruto)}`}</SummaryRow>
          ) : null}
          <SummaryRow label="Catatan" last>
            {values.notes ?? '-'}
          </SummaryRow>
        </Card>
        {photo ? (
          <View style={styles.block}>
            <PhotoThumb uri={photo.uri} label="Foto batch diterima" wide />
            <Button
              title="Foto ulang"
              variant="ghost"
              icon="camera"
              onPress={() => setStep('photo')}
            />
          </View>
        ) : (
          <Button
            title="Tambah foto (boleh dilewati)"
            variant="secondary"
            icon="camera"
            onPress={() => setStep('photo')}
          />
        )}
        {error ? (
          <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
            {error.message}
          </Text>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen
      title="Terima batch"
      subtitle={`${batch.batch_code}, ${batch.item}`}
      back
      footer={
        <BottomBar>
          <Button title="Periksa" onPress={review} style={styles.flex} />
        </BottomBar>
      }>
      <Card style={styles.gap}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text variant="small" color="textSecondary">
              Dikirim
            </Text>
            <Amount value={batch.sent_gram} unit="gram" size="l" />
          </View>
          <Badge status={batch.status} kind="batch" />
        </View>
        <Text variant="small" color="textSecondary">
          Kode stok {batch.kode_stok ?? '-'}
          {batch.grades.length ? `, grade ${batch.grades.join(' dan ')}` : ''}
        </Text>
      </Card>

      {isFeatureEnabled('containers') ? (
        <Section title="Wadah" description="Scan QR wadah supaya tara terisi otomatis.">
          {container ? (
            <Card style={styles.gap}>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text variant="bodyStrong">
                    {container.kode}, {container.nama}
                  </Text>
                  <Text variant="small" color="textSecondary">
                    Tara {formatGram(container.tara_gram)}
                  </Text>
                </View>
                <Badge status={container.status} kind="container_status" />
              </View>
              <View style={styles.actions}>
                <Button
                  title="Ganti wadah"
                  variant="secondary"
                  icon="maximize"
                  onPress={() => setStep('scan')}
                  style={styles.flex}
                />
                <Button
                  title="Tanpa wadah"
                  variant="ghost"
                  onPress={() => setContainer(null)}
                  style={styles.flex}
                />
              </View>
            </Card>
          ) : (
            <Button
              title="Scan QR wadah"
              variant="secondary"
              icon="maximize"
              onPress={() => setStep('scan')}
            />
          )}
        </Section>
      ) : null}

      <View style={styles.gap}>
        {container ? (
          <>
            <GramInput
              label="Bruto (wadah + isi)"
              value={input.bruto}
              onChangeValue={set('bruto')}
              error={errors.bruto}
              hint="Gram diterima = bruto - tara."
            />
            <GramInput
              label="Tara wadah"
              value={input.tare}
              onChangeValue={set('tare')}
              placeholder={formatGram(container.tara_gram, { unit: false })}
              hint="Kosongkan untuk memakai tara wadah."
              error={errors.tare}
            />
            {input.tare.trim() ? (
              <TextField
                label="Alasan tara berbeda"
                value={input.tareReason}
                onChangeText={set('tareReason')}
                error={errors.tareReason}
              />
            ) : null}
          </>
        ) : (
          <GramInput
            label="Gram diterima"
            value={input.gram}
            onChangeValue={set('gram')}
            placeholder="0"
            hint={`Tidak boleh lebih dari ${formatGram(batch.sent_gram)}.`}
            max={batch.sent_gram}
            maxMessage={`Melebihi gram kiriman (${formatGram(batch.sent_gram)}).`}
            error={errors.gram}
          />
        )}
        <PcsInput
          label="Pcs diterima (boleh kosong)"
          value={input.pcs}
          onChangeValue={set('pcs')}
          error={errors.pcs}
        />
        <TextField
          label="Catatan selisih"
          value={input.notes}
          onChangeText={set('notes')}
          multiline
          placeholder="Contoh: tercecer saat bongkar"
          hint="Wajib bila gram diterima kurang dari kiriman, minimal 5 huruf."
          error={errors.notes}
        />
      </View>
      <View style={[styles.note, { backgroundColor: colors.infoBg }]}>
        <Icon name="info" size={18} color={colors.info} />
        <Text variant="small" style={[styles.flex, { color: colors.info }]}>
          Selisih dicatat sebagai susut penerimaan. Nilai HPP batch tidak berubah.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexHalf: { flex: 0.6 },
  gap: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  actions: { flexDirection: 'row', gap: space.sm },
  block: { gap: space.sm },
  note: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
});

export default ReceiveBatch;
