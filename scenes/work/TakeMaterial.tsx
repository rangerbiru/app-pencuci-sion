import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import useFieldSubmit from '@/hooks/useFieldSubmit';
import { radius, sizes, space } from '@/theme';
import { MyRation } from '@/types';
import { toApiError, useGetMyRationsQuery, staleError } from '@/services';
import { submitTakeMaterial } from '@/services/fieldActions';
import { compareDecimal, subDecimal } from '@/utils/decimal';
import { formatGram, formatPcs } from '@/utils/format';
import { Photo } from '@/utils/photo';
import Screen from '@/components/layouts/Screen';
import CameraCapture from '@/components/elements/CameraCapture';
import Card from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import Button from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import Amount from '@/components/elements/Amount';
import Icon from '@/components/elements/Icon';
import { PhotoThumb } from '@/components/elements/Photo';
import { SkeletonRows } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';
import TakeMaterialForm from './TakeMaterialForm';
import { TakeMaterialErrors, TakeMaterialValues } from './takeMaterialForm';
import { SummaryRow } from './SummaryRows';

type Step = 'pick' | 'photo' | 'form' | 'summary';

const STEP_TITLE: Record<Step, string> = {
  pick: 'Langkah 1 dari 3: pilih jatah',
  photo: 'Langkah 2 dari 3: foto timbangan',
  form: 'Langkah 3 dari 3: isi gram',
  summary: 'Periksa sebelum kirim',
};

/** Ambil bahan: pilih jatah -> foto timbangan -> gram/pcs -> ringkasan -> kirim. */
function TakeMaterial() {
  const { colors } = useTheme();
  const rations = useGetMyRationsQuery();
  const { submit, submitting, error } = useFieldSubmit();
  const [step, setStep] = useState<Step>('pick');
  const [selected, setSelected] = useState<MyRation | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [values, setValues] = useState<TakeMaterialValues | null>(null);
  const [raw, setRaw] = useState<{ gram: string; pcs: string } | undefined>();
  const [serverErrors, setServerErrors] = useState<TakeMaterialErrors | undefined>();

  const available = (rations.data ?? []).filter(r => compareDecimal(r.remaining_gram, '0') > 0);
  const [pickError, setPickError] = useState<string | null>(null);
  const chosen = selected ?? (available.length === 1 ? available[0] : null);

  async function send() {
    if (!selected || !photo || !values) return;
    const outcome = await submit(
      () =>
        submitTakeMaterial({
          batchAssignmentId: selected.batch_assignment_id,
          batchCode: selected.batch_code,
          weight: values.weight,
          pcs: values.pcs,
          photo,
        }),
      'Pengambilan terkirim',
    );
    if (outcome.status === 'rejected') {
      const fe = outcome.error.fieldErrors;
      if (fe.weight || fe.pcs) {
        setServerErrors({ gram: fe.weight, pcs: fe.pcs });
        setStep('form');
      }
      return;
    }
    router.replace('/beranda');
  }

  if (step === 'photo') {
    return (
      <Screen title="Ambil bahan" subtitle={STEP_TITLE.photo} back scroll={false} padded={false}>
        <CameraCapture
          facing="back"
          guide="scale"
          hint="Masukkan layar timbangan ke dalam bingkai. Angka gram harus terbaca."
          onConfirm={p => {
            setPhoto(p);
            setStep('form');
          }}
        />
      </Screen>
    );
  }

  if (step === 'form' && selected && photo) {
    return (
      <Screen title="Ambil bahan" subtitle={STEP_TITLE.form} back>
        <TakeMaterialForm
          ration={selected}
          photoUri={photo.uri}
          initial={raw}
          serverErrors={serverErrors}
          onRetakePhoto={() => setStep('photo')}
          onValid={(v, r) => {
            setValues(v);
            setRaw(r);
            setServerErrors(undefined);
            setStep('summary');
          }}
        />
      </Screen>
    );
  }

  if (step === 'summary' && selected && photo && values) {
    return (
      <Screen
        title="Ambil bahan"
        subtitle={STEP_TITLE.summary}
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
              title="Kirim pengambilan"
              onPress={send}
              isLoading={submitting}
              style={styles.flex}
            />
          </BottomBar>
        }>
        <Card>
          <SummaryRow label="Gram">
            <Amount value={values.weight} unit="gram" size="xl" />
          </SummaryRow>
          <SummaryRow label="Pcs">
            {values.pcs === null ? '-' : `${formatPcs(values.pcs)} pcs`}
          </SummaryRow>
          <SummaryRow label="Jatah">{`${selected.item}, batch ${selected.batch_code}`}</SummaryRow>
          <SummaryRow label="Sisa jatah setelah disetujui" last>
            {formatGram(subDecimal(selected.remaining_gram, values.weight))}
          </SummaryRow>
        </Card>
        <View style={styles.photoBlock}>
          <Text variant="smallStrong">Foto timbangan</Text>
          <PhotoThumb uri={photo.uri} label="Foto timbangan" wide />
        </View>
        <View style={[styles.note, { backgroundColor: colors.infoBg }]}>
          <Icon name="info" size={18} color={colors.info} />
          <Text variant="small" style={[styles.flex, { color: colors.info }]}>
            Pengambilan diperiksa Kepala Pencuci atau Mandor. Jatah berkurang setelah disetujui.
          </Text>
        </View>
        {error && !error.fieldErrors.weight ? (
          <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
            {error.message}
          </Text>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen
      title="Ambil bahan"
      subtitle={STEP_TITLE.pick}
      back
      refreshing={rations.isFetching && !rations.isLoading}
      refreshError={staleError(rations)}
      onRefresh={rations.refetch}
      footer={
        available.length > 0 ? (
          <BottomBar>
            <Button
              title="Lanjut foto timbangan"
              icon="camera"
              onPress={() => {
                if (!chosen) {
                  setPickError('Pilih jatah yang diambil dulu.');
                  return;
                }
                setSelected(chosen);
                setPickError(null);
                setStep('photo');
              }}
              style={styles.flex}
            />
          </BottomBar>
        ) : undefined
      }>
      {rations.isLoading ? (
        <SkeletonRows rows={2} />
      ) : rations.error && !rations.data ? (
        <ErrorState error={toApiError(rations.error)} onRetry={rations.refetch} />
      ) : available.length === 0 ? (
        <EmptyState
          icon="package"
          title="Tidak ada jatah yang bisa diambil"
          message="Semua jatah sudah habis atau belum dibuat. Minta Mandor membuat penjatahan."
          actionLabel="Kembali ke Beranda"
          onAction={() => router.replace('/beranda')}
        />
      ) : (
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Pilih jatah"
          style={styles.options}>
          {available.map(r => {
            const active = chosen?.batch_assignment_id === r.batch_assignment_id;
            return (
              <Pressable
                key={r.batch_assignment_id}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${r.item}, batch ${r.batch_code}, sisa ${formatGram(r.remaining_gram)}`}
                onPress={() => {
                  setSelected(r);
                  setPickError(null);
                }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: pressed ? colors.pressed : colors.surface,
                    borderColor: active ? colors.accent : colors.border,
                    borderWidth: active ? 2 : 1,
                  },
                ]}>
                <View
                  style={[
                    styles.radio,
                    { borderColor: active ? colors.accent : colors.borderStrong },
                  ]}>
                  {active ? (
                    <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />
                  ) : null}
                </View>
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{r.item}</Text>
                  <Text variant="small" color="textSecondary">
                    Batch {r.batch_code}
                  </Text>
                </View>
                <View style={styles.right}>
                  <Text variant="small" color="textSecondary">
                    Sisa
                  </Text>
                  <Amount value={r.remaining_gram} unit="gram" size="m" />
                </View>
              </Pressable>
            );
          })}
          {pickError ? (
            <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
              {pickError}
            </Text>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexHalf: { flex: 0.6 },
  options: { gap: space.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    minHeight: sizes.primaryButton + space.lg,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  right: { alignItems: 'flex-end' },
  photoBlock: { gap: space.sm },
  note: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
});

export default TakeMaterial;
