import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import { space } from '@/theme';
import { toApiError, useGetItemsQuery, useGetMeQuery, useGetRationBatchesQuery } from '@/services';
import { submitPrepareBatch } from '@/services/fieldActions';
import useFieldSubmit from '@/hooks/useFieldSubmit';
import { executorText } from '@/utils/executor';
import { formatLostGram } from '@/utils/susut';
import Susut from '@/components/elements/Susut';
import type { PreparationResult } from '@/types';
import { formatDateTime, jakarta } from '@/utils/date';
import { formatGram } from '@/utils/format';
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
import { SkeletonDetail } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';
import { SummaryRow } from '@/scenes/work/SummaryRows';
import {
  CrushedLine,
  PreparationErrors,
  PreparationInput,
  preparationTotals,
  validatePreparation,
} from './preparationForm';

let lineSeq = 0;
const newLine = (): CrushedLine => ({ key: `l${++lineSeq}`, itemId: null, gram: '', pcs: '' });

/**
 * Penyiapan di rumah pencucian (batch yang belum G1). Isian: gram G1 hasil timbang dan susut
 * hancur (boleh kosong). Semua nilai HPP masuk ke G1 yang menjadi batch baru {kode}-P1; hancur
 * menjadi stok sendiri; hilang = masuk - G1 - hancur dihitung langsung di layar.
 */
function Preparation({ batchId }: { batchId: number }) {
  const { colors } = useTheme();
  const batches = useGetRationBatchesQuery();
  const items = useGetItemsQuery({ jenis: 'hasil_produksi' });
  const me = useGetMeQuery();
  const { submit, submitting } = useFieldSubmit();
  const batch = batches.data?.find(b => b.id === batchId);
  const [input, setInput] = useState<PreparationInput>({
    processType: null,
    notes: '',
    g1Gram: '',
    g1Pcs: '',
    crushed: [],
  });
  const [errors, setErrors] = useState<PreparationErrors>({ rows: {} });
  const [confirm, setConfirm] = useState<ReturnType<typeof validatePreparation> | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<PreparationResult | null>(null);

  // item susut hancur: yang bertanda `susut_hancur` dari server; kalau belum ada tandanya,
  // hasil produksi grup "hancur"; kalau itu pun kosong, semua hasil produksi
  const crushedItems = useMemo(() => {
    const all = items.data?.data ?? [];
    const flagged = all.filter(i => i.susut_hancur);
    if (flagged.length) return flagged;
    const hancur = all.filter(i => i.grup_hasil?.code === 'hancur');
    return hancur.length ? hancur : all;
  }, [items.data]);

  if (batches.isLoading) {
    return (
      <Screen title="Penyiapan" back>
        <SkeletonDetail facts={3} photo={false} />
      </Screen>
    );
  }
  if (result) {
    return (
      <Screen title="Penyiapan tersimpan" subtitle={batch?.batch_code} back>
        <Card>
          <SummaryRow label="Gram masuk">{formatGram(result.input_gram)}</SummaryRow>
          <SummaryRow label="G1 hasil">
            {formatGram(result.g1_gram ?? result.output_gram)}
          </SummaryRow>
          <SummaryRow label="Susut">
            <Susut
              crushedGram={result.crushed_gram}
              lostGram={result.lost_gram}
              lostPercent={result.lost_percent}
              legacyGram={result.lost_gram ? undefined : result.susut_gram}
              baseGram={result.input_gram}
              hideWhenEmpty={false}
            />
          </SummaryRow>
          <SummaryRow label="Pelaksana" last>
            {executorText(result.executor_role, me.data?.name) ?? '-'}
          </SummaryRow>
        </Card>
        {result.batches.length > 0 ? (
          <Section title="Batch baru">
            <Card>
              {result.batches.map((b, i) => (
                <SummaryRow
                  key={b.id}
                  label={b.batch_code}
                  last={i === result.batches.length - 1 && !result.crushed?.length}>
                  {`${b.kode_stok ?? ''} ${formatGram(b.received_gram ?? b.sent_gram)}`.trim()}
                </SummaryRow>
              ))}
            </Card>
          </Section>
        ) : null}
        {result.crushed && result.crushed.length > 0 ? (
          <Section title="Stok hancur">
            <Card>
              {result.crushed.map((c, i) => (
                <SummaryRow key={c.id} label={c.item} last={i === result.crushed!.length - 1}>
                  {`${c.kode_stok ?? ''} ${formatGram(c.gram)}`.trim()}
                </SummaryRow>
              ))}
            </Card>
          </Section>
        ) : null}
        <Button title="Selesai" onPress={() => router.back()} />
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
          message="Penyiapan hanya untuk batch yang sudah diterima, belum G1, dan belum dijatah."
          actionLabel="Kembali"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const inputGram = batch.received_gram ?? batch.remaining_gram ?? '0.00';
  const totals = preparationTotals(inputGram, input.g1Gram, input.crushed);
  const clearError = (key?: keyof PreparationErrors) =>
    setErrors(e => ({ ...e, total: undefined, ...(key ? { [key]: undefined } : {}) }));
  const setLine = (key: string, change: Partial<CrushedLine>) => {
    setInput(p => ({
      ...p,
      crushed: p.crushed.map(l => (l.key === key ? { ...l, ...change } : l)),
    }));
    setErrors(e => {
      const rows = { ...e.rows };
      delete rows[key];
      return { ...e, rows, total: undefined };
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
    setConfirm(res);
  }

  async function save() {
    if (!confirm?.ok || !batch) return;
    const body = confirm.body;
    const outcome = await submit(
      () => submitPrepareBatch({ batchId: batch.id, batchCode: batch.batch_code, body }),
      'Penyiapan tersimpan',
    );
    setConfirm(null);
    if (outcome.status === 'rejected') {
      const fe = outcome.error.fieldErrors;
      setServerError(outcome.error.message);
      setErrors(e => ({
        ...e,
        processType: fe.process_type,
        g1Gram: fe.g1_gram,
        g1Pcs: fe.g1_pcs,
      }));
      return;
    }
    if (outcome.status === 'sent') setResult(outcome.data.data);
    else router.back();
  }

  const usedIds = input.crushed.map(l => l.itemId).filter((x): x is number => !!x);
  const lostText = formatLostGram(totals.lostGram);

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
        <SummaryRow label="Susut" last>
          {totals.over ? (
            <Text variant="bodyStrong" color="danger">
              G1 + hancur melebihi gram masuk
            </Text>
          ) : (
            <Susut
              crushedGram={input.crushed.length ? totals.crushedGram : null}
              lostGram={totals.lostGram}
              baseGram={inputGram}
              hideWhenEmpty={false}
            />
          )}
        </SummaryRow>
      </Card>

      <Section title="Proses">
        <Segmented<'kering' | 'basah'>
          accessibilityLabel="Jenis proses"
          value={input.processType ?? ('' as 'kering')}
          onChange={v => {
            setInput(p => ({ ...p, processType: v }));
            clearError('processType');
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
        title="Hasil G1"
        description="Gram G1 hasil timbang. Seluruh nilai HPP batch masuk ke G1 dan langsung siap dijatah.">
        <Card style={styles.gap}>
          <GramInput
            label="Gram G1"
            value={input.g1Gram}
            onChangeValue={v => {
              setInput(p => ({ ...p, g1Gram: v }));
              clearError('g1Gram');
            }}
            placeholder="0"
            error={errors.g1Gram ?? errors.total}
          />
          <PcsInput
            label="Pcs G1 (boleh kosong)"
            value={input.g1Pcs}
            onChangeValue={v => {
              setInput(p => ({ ...p, g1Pcs: v }));
              clearError('g1Pcs');
            }}
            placeholder="0"
            error={errors.g1Pcs}
          />
        </Card>
      </Section>

      <Section title="Susut hancur" description="Boleh kosong. Tiap baris menjadi stok sendiri.">
        {input.crushed.map((l, i) => {
          const rowErr = errors.rows[l.key] ?? {};
          return (
            <Card key={l.key} style={styles.gap}>
              <View style={styles.rowHead}>
                <Text variant="bodyStrong" style={styles.flex}>
                  Hancur {i + 1}
                </Text>
                <IconButton
                  icon="trash-2"
                  accessibilityLabel={`Hapus hancur ${i + 1}`}
                  onPress={() => {
                    setInput(p => ({ ...p, crushed: p.crushed.filter(x => x.key !== l.key) }));
                    clearError();
                  }}
                />
              </View>
              <ItemPicker
                label="Item"
                items={crushedItems}
                loading={items.isLoading}
                value={l.itemId}
                usedIds={usedIds}
                onChange={it => setLine(l.key, { itemId: it.id })}
                error={rowErr.item}
              />
              <GramInput
                label="Gram hancur"
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
        <Button
          title="Tambah susut hancur"
          variant="secondary"
          icon="plus"
          onPress={() => setInput(p => ({ ...p, crushed: [...p.crushed, newLine()] }))}
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
        confirmLabel="Ya, simpan"
        onConfirm={save}
        onCancel={() => setConfirm(null)}
        isLoading={submitting}>
        <Card padded={false} style={styles.sheet}>
          <SummaryRow label="G1">{formatGram(totals.g1Gram)}</SummaryRow>
          <SummaryRow label="Hancur">
            <Susut crushedGram={totals.crushedGram} baseGram={inputGram} hideWhenEmpty={false} />
          </SummaryRow>
          <SummaryRow label="Hilang" last>
            <Text variant="bodyStrong" color="danger">
              {lostText}
            </Text>
          </SummaryRow>
        </Card>
        <Text variant="small" color="textSecondary">
          Batch {batch.batch_code} menjadi Selesai dan tidak bisa dijatah lagi.
        </Text>
      </Dialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  note: { padding: space.md, borderRadius: 8 },
  sheet: { paddingHorizontal: space.lg },
});

export default Preparation;
