import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '@/theme';
import { MyRation } from '@/types';
import { formatGram } from '@/utils/format';
import { GramInput, PcsInput } from '@/components/elements/NumberInput';
import Text from '@/components/elements/Text';
import Button from '@/components/elements/Button';
import { PhotoThumb } from '@/components/elements/Photo';
import { TakeMaterialErrors, TakeMaterialValues, validateTakeMaterial } from './takeMaterialForm';

export interface TakeMaterialFormProps {
  ration: MyRation;
  photoUri: string;
  initial?: { gram: string; pcs: string };
  serverErrors?: TakeMaterialErrors;
  onRetakePhoto: () => void;
  onValid: (values: TakeMaterialValues, raw: { gram: string; pcs: string }) => void;
}

/** Langkah 3 ambil bahan: isi gram dan pcs dengan keyboard angka. */
function TakeMaterialForm({
  ration,
  photoUri,
  initial,
  serverErrors,
  onRetakePhoto,
  onValid,
}: TakeMaterialFormProps) {
  const [gram, setGram] = useState(initial?.gram ?? '');
  const [pcs, setPcs] = useState(initial?.pcs ?? '');
  const [errors, setErrors] = useState<TakeMaterialErrors>({});

  function check() {
    const res = validateTakeMaterial({ gram, pcs }, ration.remaining_gram);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    setErrors({});
    onValid(res.values, { gram, pcs });
  }

  return (
    <View style={styles.root}>
      <View style={styles.photoRow}>
        <PhotoThumb uri={photoUri} label="Foto timbangan" size={88} />
        <View style={styles.flex}>
          <Text variant="bodyStrong">{ration.item}</Text>
          <Text variant="small" color="textSecondary">
            Batch {ration.batch_code}
          </Text>
          <Button
            title="Foto ulang"
            variant="ghost"
            icon="camera"
            onPress={onRetakePhoto}
            style={styles.retake}
          />
        </View>
      </View>
      <GramInput
        label="Gram di timbangan"
        value={gram}
        onChangeValue={setGram}
        placeholder="0"
        hint={`Sisa jatah ${formatGram(ration.remaining_gram)}`}
        max={ration.remaining_gram}
        maxMessage={`Melebihi sisa jatah (${formatGram(ration.remaining_gram)}). Kurangi gramnya.`}
        error={errors.gram ?? serverErrors?.gram}
        testID="input-gram"
      />
      <PcsInput
        label="Jumlah pcs (boleh kosong)"
        value={pcs}
        onChangeValue={setPcs}
        placeholder="0"
        error={errors.pcs ?? serverErrors?.pcs}
        testID="input-pcs"
      />
      <Button title="Periksa" onPress={check} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.lg },
  photoRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  flex: { flex: 1, gap: 2 },
  retake: { alignSelf: 'flex-start', paddingHorizontal: 0, minHeight: 44 },
});

export default TakeMaterialForm;
