import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import useFieldSubmit from '@/hooks/useFieldSubmit';
import { space } from '@/theme';
import {
  submitHandOverDamp,
  submitHandOverRework,
  submitTakeRework,
} from '@/services/fieldActions';
import { useGetMyReworkQuery } from '@/services';
import { parseUserInt } from '@/utils/decimal';
import { formatDate } from '@/utils/date';
import { formatPcs } from '@/utils/format';
import { Photo } from '@/utils/photo';
import Screen from '@/components/layouts/Screen';
import CameraCapture from '@/components/elements/CameraCapture';
import Card from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import TextField from '@/components/elements/TextField';
import Button from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import Amount from '@/components/elements/Amount';
import Icon from '@/components/elements/Icon';
import { PhotoThumb } from '@/components/elements/Photo';
import { EmptyState } from '@/components/elements/StateViews';
import { SummaryRow } from './SummaryRows';

export type PcsHandOverMode = 'serah_lembab' | 'ambil_kerja_ulang' | 'serah_kerja_ulang';

const COPY: Record<
  PcsHandOverMode,
  { title: string; send: string; success: string; photoHint: string; photoRequired: boolean }
> = {
  serah_lembab: {
    title: 'Serah hasil lembab',
    send: 'Kirim setoran',
    success: 'Setoran terkirim',
    photoHint: 'Foto hasil lembab yang diserahkan. Semua wadah harus terlihat.',
    photoRequired: true,
  },
  ambil_kerja_ulang: {
    title: 'Ambil kerja ulang',
    send: 'Kirim pengambilan kerja ulang',
    success: 'Pengambilan kerja ulang terkirim',
    photoHint: 'Foto bahan kerja ulang yang diambil (boleh dilewati).',
    photoRequired: false,
  },
  serah_kerja_ulang: {
    title: 'Serah kerja ulang',
    send: 'Kirim setoran kerja ulang',
    success: 'Setoran kerja ulang terkirim',
    photoHint: 'Foto hasil kerja ulang yang diserahkan.',
    photoRequired: true,
  },
};

type Step = 'pcs' | 'photo' | 'summary';

/**
 * Serah hasil lembab dan kerja ulang: pcs + foto -> ringkasan -> kirim. Gram tidak diminta
 * karena hasil masih basah.
 */
function HandOverDamp({ mode, reworkId }: { mode: PcsHandOverMode; reworkId?: number }) {
  const { colors } = useTheme();
  const copy = COPY[mode];
  const isRework = mode !== 'serah_lembab';
  const rework = useGetMyReworkQuery(undefined, { skip: !isRework });
  const item = rework.data?.find(r => r.id === reworkId);
  const defaultPcs = mode === 'serah_kerja_ulang' ? (item?.taken_pcs ?? item?.pcs) : item?.pcs;

  const { submit, submitting, error } = useFieldSubmit();
  const [step, setStep] = useState<Step>('pcs');
  const [pcsText, setPcsText] = useState('');
  const [pcsError, setPcsError] = useState<string | undefined>();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const pcs = parseUserInt(pcsText || (defaultPcs != null && !pcsText ? String(defaultPcs) : ''));

  if (isRework && !rework.isLoading && !item) {
    return (
      <Screen title={copy.title} back>
        <EmptyState
          icon="repeat"
          title="Kerja ulang tidak ditemukan"
          message="Mungkin sudah diambil, diserahkan, atau dibatalkan. Kembali ke Beranda untuk melihat langkah sekarang."
          actionLabel="Kembali ke Beranda"
          onAction={() => router.replace('/beranda')}
        />
      </Screen>
    );
  }

  function checkPcs() {
    if (pcs === null || pcs < 1) {
      setPcsError('Isi jumlah pcs, paling sedikit 1.');
      return;
    }
    setPcsError(undefined);
    setStep(copy.photoRequired && !photo ? 'photo' : 'summary');
  }

  async function send() {
    if (pcs === null) return;
    const outcome = await submit(() => {
      if (mode === 'serah_lembab') return submitHandOverDamp({ pcs, photo: photo as Photo });
      if (mode === 'ambil_kerja_ulang')
        return submitTakeRework({ reworkItemId: reworkId as number, pcs, photo });
      return submitHandOverRework({ reworkItemId: reworkId as number, pcs, photo: photo as Photo });
    }, copy.success);
    if (outcome.status === 'rejected') {
      if (outcome.error.fieldErrors.pcs) {
        setPcsError(outcome.error.fieldErrors.pcs);
        setStep('pcs');
      }
      return;
    }
    router.replace('/beranda');
  }

  if (step === 'photo') {
    return (
      <Screen title={copy.title} subtitle="Foto bukti" back scroll={false} padded={false}>
        <CameraCapture
          facing="back"
          guide="document"
          hint={copy.photoHint}
          onConfirm={p => {
            setPhoto(p);
            setStep('summary');
          }}
        />
      </Screen>
    );
  }

  if (step === 'summary' && pcs !== null) {
    return (
      <Screen
        title={copy.title}
        subtitle="Periksa sebelum kirim"
        back
        footer={
          <BottomBar>
            <Button
              title="Ubah"
              variant="secondary"
              size="large"
              onPress={() => setStep('pcs')}
              style={styles.flexHalf}
            />
            <Button title={copy.send} onPress={send} isLoading={submitting} style={styles.flex} />
          </BottomBar>
        }>
        <Card>
          <SummaryRow label="Jumlah" last={!item}>
            <Amount value={pcs} unit="pcs" size="xl" />
          </SummaryRow>
          {item ? (
            <SummaryRow label="Kartu asal" last>
              {formatDate(item.card_date)}
            </SummaryRow>
          ) : null}
        </Card>
        {photo ? (
          <View style={styles.block}>
            <Text variant="smallStrong">Foto</Text>
            <PhotoThumb uri={photo.uri} label={`Foto ${copy.title.toLowerCase()}`} wide />
            <Button
              title="Foto ulang"
              variant="ghost"
              icon="camera"
              onPress={() => setStep('photo')}
            />
          </View>
        ) : (
          <Button
            title="Tambah foto"
            variant="secondary"
            icon="camera"
            onPress={() => setStep('photo')}
          />
        )}
        <View style={[styles.note, { backgroundColor: colors.infoBg }]}>
          <Icon name="info" size={18} color={colors.info} />
          <Text variant="small" style={[styles.flex, { color: colors.info }]}>
            Setoran diperiksa Kepala Pencuci atau Mandor sebelum masuk kartu kerja.
          </Text>
        </View>
        {error && !error.fieldErrors.pcs ? (
          <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
            {error.message}
          </Text>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen
      title={copy.title}
      subtitle={copy.photoRequired ? 'Langkah 1 dari 2: jumlah pcs' : 'Jumlah pcs'}
      back
      footer={
        <BottomBar>
          <Button
            title={copy.photoRequired ? 'Lanjut foto' : 'Lanjut'}
            icon={copy.photoRequired ? 'camera' : undefined}
            onPress={checkPcs}
            style={styles.flex}
          />
        </BottomBar>
      }>
      {item ? (
        <Card>
          <SummaryRow label="Kerja ulang dari kartu">{formatDate(item.card_date)}</SummaryRow>
          <SummaryRow label="Jumlah kerja ulang" last>
            {`${formatPcs(item.pcs)} pcs`}
          </SummaryRow>
        </Card>
      ) : null}
      <TextField
        label="Jumlah pcs"
        value={pcsText}
        onChangeText={setPcsText}
        keyboardType="number-pad"
        inputMode="numeric"
        unit="pcs"
        placeholder={defaultPcs != null ? String(defaultPcs) : '0'}
        hint={
          defaultPcs != null
            ? `Kosongkan untuk memakai ${formatPcs(defaultPcs)} pcs.`
            : 'Hitung keping yang diserahkan.'
        }
        error={pcsError}
        autoFocus
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexHalf: { flex: 0.6 },
  block: { gap: space.sm },
  note: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
});

export default HandOverDamp;
