import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useToast } from '@/components/elements/Toast';
import useTheme from '@/hooks/useTheme';
import { space } from '@/theme';
import {
  toApiError,
  useGetItemsQuery,
  useGetRationBatchesQuery,
  usePrepareBatchMutation,
} from '@/services';
import { formatDateTime, jakarta } from '@/utils/date';
import { formatGram } from '@/utils/format';
import { newIdempotencyKey } from '@/utils/id';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import Button, { IconButton } from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import Segmented from '@/components/elements/Segmented';
import TextField from '@/components/elements/TextField';
import ItemPicker from '@/components/elements/ItemPicker';
import { GramInput, PcsInput } from '@/components/elements/NumberInput';
import { Dialog } from '@/components/elements/Dialog';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';
import { SummaryRow } from '@/scenes/work/SummaryRows';
import {
  PreparationErrors,
  PreparationInput,
  PreparationLine,
  preparationTotals,
  validatePreparation,
} from './preparationForm';

let lineSeq = 0;
const newLine = (): PreparationLine => ({ key: `l${++lineSeq}`, itemId: null, gram: '', pcs: '' });

/**
 * Penyiapan di rumah pencucian (batch Cuci Langsung yang sudah diterima dan belum dijatah).
 * Tiap hasil menjadi batch baru {kode}-P{n}; batch asal menjadi Selesai.
 */
function Preparation({ batchId }: { batchId: number }) {
  const { colors } = useTheme();
  const toast = useToast();
  const batches = useGetRationBatchesQuery();
  const items = useGetItemsQuery({ purpose: 'penyiapan' });
  const [prepare, prepareState] = usePrepareBatchMutation();
  const batch = batches.data?.find(b => b.id === batchId);
  const [input, setInput] = useState<PreparationInput>({
    processType: null,
    notes: '',
    lines: [newLine()],
  });
  const [errors, setErrors] = useState<PreparationErrors>({ rows: {} });
  const [confirm, setConfirm] = useState<ReturnType<typeof validatePreparation> | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  // satu key per aksi: dipakai lagi bila kiriman yang sama diulang setelah sinyal putus
  const idempotencyKey = useRef<string | null>(null);

  if (batches.isLoading) {
    return (
      <Screen title="Penyiapan" back>
        <SkeletonList rows={3} />
      </Screen>
    );
  }
  if (batches.error && !batch) {
    return (
      <Screen title="Penyiapan" back>
        <ErrorState error={toApiError(batches.error)} onRetry={batches.refetch} />
      </Screen>
    );
  }
  if (!batch || !batch.can_prepare) {
    return (
      <Screen title="Penyiapan" back>
        <EmptyState
          icon="package"
          title="Batch tidak bisa disiapkan"
          message="Penyiapan hanya untuk batch Cuci Langsung yang sudah diterima dan belum dijatah."
          actionLabel="Kembali"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const inputGram = batch.received_gram ?? batch.remaining_gram ?? '0.00';
  const totals = preparationTotals(inputGram, input.lines);
  const setLine = (key: string, change: Partial<PreparationLine>) => {
    setInput(p => ({ ...p, lines: p.lines.map(l => (l.key === key ? { ...l, ...change } : l)) }));
    // pesan error baris hilang begitu baris itu diubah
    setErrors(e => {
      if (!e.rows[key] && !e.lines) return e;
      const rows = { ...e.rows };
      delete rows[key];
      return { ...e, rows, lines: undefined };
    });
  };

  function review() {
    setServerError(null);
    // server memvalidasi prepared_at <= today (tanggal), jadi kirim tanggal Jakarta tanpa jam
    const res = validatePreparation(input, inputGram, jakarta().format('YYYY-MM-DD'));
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    setErrors({ rows: {} });
    idempotencyKey.current = idempotencyKey.current ?? newIdempotencyKey();
    setConfirm(res);
  }

  async function submit() {
    if (!confirm?.ok || !batch) return;
    try {
      const result = await prepare({
        id: batch.id,
        body: confirm.body,
        idempotencyKey: idempotencyKey.current ?? newIdempotencyKey(),
      }).unwrap();
      idempotencyKey.current = null;
      setConfirm(null);
      toast.show(`Penyiapan tersimpan: ${result.batches.length} batch baru`);
      router.back();
    } catch (e) {
      const err = toApiError(e);
      // gagal dari server (4xx): isian diperbaiki, jadi kiriman berikutnya memakai key baru
      if (err.kind === 'http' && (err.status ?? 0) < 500) idempotencyKey.current = null;
      setConfirm(null);
      setServerError(err.message);
    }
  }

  const usedIds = input.lines.map(l => l.itemId).filter((x): x is number => !!x);

  return (
    <Screen
      title="Penyiapan"
      subtitle={`${batch.batch_code}, ${batch.item}`}
      back
      footer={
        <BottomBar>
          <Button title="Periksa dan simpan" onPress={review} style={styles.flex} />
        </BottomBar>
      }>
      <Card>
        <SummaryRow label="Gram masuk">{formatGram(inputGram)}</SummaryRow>
        <SummaryRow label="Diterima">{formatDateTime(batch.received_at)}</SummaryRow>
        <SummaryRow label="Total hasil">{formatGram(totals.outputGram)}</SummaryRow>
        <SummaryRow label="Susut" last>
          <Text variant="bodyStrong" color={totals.over ? 'danger' : 'text'}>
            {formatGram(totals.susutGram)}
          </Text>
        </SummaryRow>
      </Card>

      <Section title="Proses">
        <Segmented<'kering' | 'basah'>
          accessibilityLabel="Jenis proses"
          value={input.processType ?? ('' as 'kering')}
          onChange={v => {
            setInput(p => ({ ...p, processType: v }));
            setErrors(e => ({ ...e, processType: undefined }));
          }}
          options={[
            { value: 'kering', label: 'Kering' },
            { value: 'basah', label: 'Basah' },
          ]}
        />
        {errors.processType ? (
          <Text variant="small" color="danger">
            {errors.processType}
          </Text>
        ) : null}
      </Section>

      <Section
        title="Hasil penyiapan"
        description="Bahan utama dan sampingan. Tiap hasil menjadi batch baru.">
        {input.lines.map((l, i) => {
          const rowErr = errors.rows[l.key] ?? {};
          return (
            <Card key={l.key} style={styles.gap}>
              <View style={styles.rowHead}>
                <Text variant="bodyStrong" style={styles.flex}>
                  Hasil {i + 1}
                </Text>
                {input.lines.length > 1 ? (
                  <IconButton
                    icon="trash-2"
                    accessibilityLabel={`Hapus hasil ${i + 1}`}
                    onPress={() =>
                      setInput(p => ({ ...p, lines: p.lines.filter(x => x.key !== l.key) }))
                    }
                  />
                ) : null}
              </View>
              <ItemPicker
                label="Item"
                items={items.data?.data ?? []}
                loading={items.isLoading}
                value={l.itemId}
                usedIds={usedIds}
                onChange={it => setLine(l.key, { itemId: it.id })}
                error={rowErr.item}
              />
              <GramInput
                label="Gram hasil"
                value={l.gram}
                onChangeValue={v => setLine(l.key, { gram: v })}
                placeholder="0"
                error={rowErr.gram}
              />
              <PcsInput
                label="Pcs (boleh kosong)"
                value={l.pcs}
                onChangeValue={v => setLine(l.key, { pcs: v })}
                placeholder="0"
                error={rowErr.pcs}
              />
            </Card>
          );
        })}
        {errors.lines ? (
          <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
            {errors.lines}
          </Text>
        ) : null}
        <Button
          title="Tambah hasil"
          variant="secondary"
          icon="plus"
          onPress={() => setInput(p => ({ ...p, lines: [...p.lines, newLine()] }))}
        />
      </Section>

      <TextField
        label="Catatan (boleh kosong)"
        value={input.notes}
        onChangeText={v => setInput(p => ({ ...p, notes: v }))}
        multiline
        placeholder="Contoh: dipisah bulu halus"
      />

      {serverError ? (
        <View style={[styles.note, { backgroundColor: colors.dangerBg }]}>
          <Text variant="smallStrong" color="danger">
            {serverError}
          </Text>
        </View>
      ) : null}

      <Dialog
        visible={!!confirm?.ok}
        title="Simpan penyiapan?"
        message={`${input.lines.length} hasil, total ${formatGram(totals.outputGram)}, susut ${formatGram(totals.susutGram)}. Batch ${batch.batch_code} menjadi Selesai dan tidak bisa dijatah lagi.`}
        confirmLabel="Ya, simpan"
        onConfirm={submit}
        onCancel={() => setConfirm(null)}
        isLoading={prepareState.isLoading}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  note: { padding: space.md, borderRadius: 8 },
});

export default Preparation;
