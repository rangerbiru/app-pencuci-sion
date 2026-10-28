import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import { radius, sizes, space } from '@/theme';
import { useGetItemsQuery, useGetMeQuery } from '@/services';
import { submitPrepareBatch } from '@/services/fieldActions';
import useFieldSubmit from '@/hooks/useFieldSubmit';
import { executorText } from '@/utils/executor';
import { formatLostGram } from '@/utils/susut';
import { formatGram } from '@/utils/format';
import { jakarta } from '@/utils/date';
import { lineItemName, notaText, preparableLines } from '@/utils/batchLines';
import Susut from '@/components/elements/Susut';
import type { PreparationResult, RationBatch } from '@/types';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import Icon from '@/components/elements/Icon';
import Button, { IconButton } from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import Segmented from '@/components/elements/Segmented';
import TextField from '@/components/elements/TextField';
import ItemPicker from '@/components/elements/ItemPicker';
import { GramInput, PcsInput } from '@/components/elements/NumberInput';
import { Dialog } from '@/components/elements/Dialog';
import { SummaryRow } from '@/scenes/work/SummaryRows';
import { LineBadge } from './BatchLines';
import {
  GROUP_OPTIONS,
  OutputRow,
  PreparationLinesErrors,
  PreparationLinesInput,
  groupLabel,
  lineInputGram,
  preparationLinesTotals,
  selectableTogether,
  validatePreparationLines,
} from './preparationLinesForm';

let rowSeq = 0;
const newOutput = (type: OutputRow['type']): OutputRow => ({
  key: `o${++rowSeq}`,
  type,
  itemId: null,
  gram: '',
  pcs: '',
  group: 'layak_jual',
});

const itemName = (i: string | { id: number; name: string }) => (typeof i === 'string' ? i : i.name);

/**
 * Penyiapan per baris (revisi 26/10): pilih satu atau lebih baris G2/G3 yang gradenya sama, lalu
 * daftar hasil (utama G1 dan sampingan). Hilang = total masuk - total hasil, tampil minus.
 * Hasil utama G1 menjadi baris baru di batch yang sama.
 */
function PreparationLines({ batch }: { batch: RationBatch }) {
  const { colors } = useTheme();
  const items = useGetItemsQuery({ purpose: 'penyiapan' });
  const me = useGetMeQuery();
  const { submit, submitting } = useFieldSubmit();
  const candidates = preparableLines(batch);
  const [input, setInput] = useState<PreparationLinesInput>({
    lineIds: candidates.length === 1 ? [candidates[0].id] : [],
    processType: null,
    notes: '',
    outputs: [],
  });
  const [errors, setErrors] = useState<PreparationLinesErrors>({ rows: {} });
  const [confirm, setConfirm] = useState<ReturnType<typeof validatePreparationLines> | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<PreparationResult | null>(null);

  // hasil utama = bahan baku; sampingan = item sampingan dulu. Daftar kosong: pakai semua item.
  const { mainItems, sideItems } = useMemo(() => {
    const all = items.data?.data ?? [];
    const bahan = all.filter(i => i.jenis.code === 'bahan_baku');
    const sampingan = all.filter(i => i.jenis.code === 'sampingan');
    return {
      mainItems: bahan.length ? bahan : all,
      sideItems: sampingan.length ? [...sampingan, ...bahan] : all,
    };
  }, [items.data]);

  const picked = candidates.filter(l => input.lineIds.includes(l.id));
  const totals = preparationLinesTotals(picked, input.outputs);

  if (result) {
    const outputs = result.outputs ?? [];
    return (
      <Screen title="Penyiapan tersimpan" subtitle={batch.batch_code} back>
        <Card>
          <SummaryRow label="Gram masuk">{formatGram(result.input_gram)}</SummaryRow>
          <SummaryRow label="Gram hasil">{formatGram(result.output_gram)}</SummaryRow>
          <SummaryRow label="Susut">
            <Susut
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
        {result.lines && result.lines.length > 0 ? (
          <Section title="Baris G1 baru">
            <Card>
              {result.lines.map((l, i) => (
                <SummaryRow
                  key={l.id}
                  label={[lineItemName(l.item), notaText(l.nota)].filter(Boolean).join(' · ')}
                  last={i === result.lines!.length - 1}>
                  {`Grade ${l.grade ?? 1}, ${formatGram(l.gram)}`}
                </SummaryRow>
              ))}
            </Card>
          </Section>
        ) : null}
        {outputs.length > 0 ? (
          <Section title="Semua hasil">
            <Card>
              {outputs.map((o, i) => (
                <SummaryRow
                  key={o.id}
                  label={`${itemName(o.item)}, ${o.type === 'main' ? 'Hasil utama G1' : `Sampingan ${groupLabel(o.group) ?? ''}`.trim()}`}
                  last={i === outputs.length - 1}>
                  {`${o.kode_stok ?? ''} ${formatGram(o.gram)}`.trim()}
                </SummaryRow>
              ))}
            </Card>
          </Section>
        ) : null}
        <Button title="Selesai" onPress={() => router.back()} />
      </Screen>
    );
  }

  const clearTotal = () => setErrors(e => ({ ...e, total: undefined, outputs: undefined }));
  const setOutput = (key: string, change: Partial<OutputRow>) => {
    setInput(p => ({
      ...p,
      outputs: p.outputs.map(o => (o.key === key ? { ...o, ...change } : o)),
    }));
    setErrors(e => {
      const rows = { ...e.rows };
      delete rows[key];
      return { ...e, rows, total: undefined, outputs: undefined };
    });
  };

  function toggleLine(id: number) {
    setInput(p => ({
      ...p,
      lineIds: p.lineIds.includes(id) ? p.lineIds.filter(x => x !== id) : [...p.lineIds, id],
    }));
    setErrors(e => ({ ...e, lines: undefined, total: undefined }));
  }

  function review() {
    setServerError(null);
    // server memvalidasi prepared_at <= today (tanggal), jadi kirim tanggal Jakarta tanpa jam
    const res = validatePreparationLines(input, picked, jakarta().format('YYYY-MM-DD'));
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    setErrors({ rows: {} });
    setConfirm(res);
  }

  async function save() {
    if (!confirm?.ok) return;
    const body = confirm.body;
    const outcome = await submit(
      () => submitPrepareBatch({ batchId: batch.id, batchCode: batch.batch_code, body }),
      'Penyiapan tersimpan',
    );
    setConfirm(null);
    if (outcome.status === 'rejected') {
      const fe = outcome.error.fieldErrors;
      setServerError(outcome.error.message);
      setErrors(e => ({ ...e, processType: fe.process_type, lines: fe.line_ids }));
      return;
    }
    if (outcome.status === 'sent') setResult(outcome.data.data);
    else router.back();
  }

  const lostText = formatLostGram(totals.lostGram);
  const mainCount = input.outputs.filter(o => o.type === 'main').length;

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
      <Section
        title="1. Pilih baris"
        description="Baris Grade 2/3 yang disiapkan bersama harus satu grade. Item dan nota boleh berbeda.">
        <View style={styles.list}>
          {candidates.map(l => {
            const active = input.lineIds.includes(l.id);
            const allowed = active || selectableTogether(l, picked);
            return (
              <Pressable
                key={l.id}
                disabled={!allowed}
                onPress={() => toggleLine(l.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active, disabled: !allowed }}
                accessibilityLabel={`${lineItemName(l.item)}, ${notaText(l.nota) ?? 'tanpa nota'}, Grade ${l.grade ?? '-'}, ${formatGram(lineInputGram(l))}${allowed ? '' : ', gradenya berbeda'}`}
                style={({ pressed }) => [
                  styles.lineCard,
                  {
                    borderColor: active ? colors.fieldFocus : colors.fieldBorder,
                    borderWidth: active ? 2 : 1,
                    backgroundColor: active
                      ? colors.navIndicator
                      : pressed
                        ? colors.pressed
                        : colors.surface,
                    opacity: allowed ? 1 : 0.55,
                  },
                ]}>
                <View style={styles.rowHead}>
                  <Icon
                    name={active ? 'check-square' : 'square'}
                    size={20}
                    color={active ? colors.onNavIndicator : colors.textSecondary}
                  />
                  <Text variant="bodyStrong" style={styles.flex}>
                    {lineItemName(l.item)}
                  </Text>
                  <Text variant="bodyStrong">{formatGram(lineInputGram(l))}</Text>
                </View>
                <Text variant="small" color={active ? 'onNavIndicator' : 'textSecondary'}>
                  {[notaText(l.nota), l.grade != null ? `Grade ${l.grade}` : null]
                    .filter(Boolean)
                    .join(' · ') || 'Tanpa nota'}
                </Text>
                <LineBadge line={l} />
              </Pressable>
            );
          })}
        </View>
        {errors.lines ? (
          <Text variant="small" color="danger">
            {errors.lines}
          </Text>
        ) : null}
      </Section>

      <Card>
        <SummaryRow label="Total masuk">{formatGram(totals.inputGram)}</SummaryRow>
        <SummaryRow label="Total hasil">{formatGram(totals.outputGram)}</SummaryRow>
        <SummaryRow label="Susut" last>
          {totals.over ? (
            <Text variant="bodyStrong" color="danger">
              Total hasil melebihi total masuk
            </Text>
          ) : input.outputs.length === 0 ? (
            <Text color="textSecondary">Tambah hasil dulu</Text>
          ) : (
            <Susut lostGram={totals.lostGram} baseGram={totals.inputGram} hideWhenEmpty={false} />
          )}
        </SummaryRow>
      </Card>

      <Section title="2. Proses">
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
        title="3. Hasil"
        description="Minimal satu Hasil utama G1. Nilai HPP dibagi ke semua hasil dengan bobot harga bahan.">
        {input.outputs.map((o, i) => {
          const rowErr = errors.rows[o.key] ?? {};
          return (
            <Card key={o.key} style={styles.gap}>
              <View style={styles.rowHead}>
                <Text variant="bodyStrong" style={styles.flex}>
                  Hasil {i + 1}
                </Text>
                <IconButton
                  icon="trash-2"
                  accessibilityLabel={`Hapus hasil ${i + 1}`}
                  onPress={() => {
                    setInput(p => ({ ...p, outputs: p.outputs.filter(x => x.key !== o.key) }));
                    clearTotal();
                  }}
                />
              </View>
              <Segmented<OutputRow['type']>
                accessibilityLabel={`Jenis hasil ${i + 1}`}
                value={o.type}
                onChange={v => setOutput(o.key, { type: v, itemId: null })}
                options={[
                  { value: 'main', label: 'Hasil utama G1' },
                  { value: 'byproduct', label: 'Sampingan' },
                ]}
              />
              <ItemPicker
                label="Item"
                items={o.type === 'main' ? mainItems : sideItems}
                loading={items.isLoading}
                value={o.itemId}
                onChange={it => setOutput(o.key, { itemId: it.id })}
                error={rowErr.item}
              />
              <GramInput
                label="Gram"
                value={o.gram}
                onChangeValue={v => setOutput(o.key, { gram: v })}
                placeholder="0"
                error={rowErr.gram}
              />
              <PcsInput
                label="Pcs (boleh kosong)"
                value={o.pcs}
                onChangeValue={v => setOutput(o.key, { pcs: v })}
                placeholder="0"
                error={rowErr.pcs}
              />
              {o.type === 'byproduct' ? (
                <View style={styles.gap}>
                  <Text variant="smallStrong">Grup tujuan</Text>
                  <Segmented
                    accessibilityLabel={`Grup tujuan hasil ${i + 1}`}
                    value={o.group}
                    onChange={v => setOutput(o.key, { group: v })}
                    options={GROUP_OPTIONS}
                  />
                </View>
              ) : null}
            </Card>
          );
        })}
        {errors.outputs || errors.total ? (
          <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
            {errors.total ?? errors.outputs}
          </Text>
        ) : null}
        <Button
          title="Tambah hasil"
          variant="secondary"
          icon="plus"
          onPress={() => {
            setInput(p => ({
              ...p,
              // hasil pertama = utama G1; berikutnya sampingan
              outputs: [...p.outputs, newOutput(p.outputs.length === 0 ? 'main' : 'byproduct')],
            }));
            clearTotal();
          }}
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
          <SummaryRow label="Baris disiapkan">{`${picked.length} baris, ${formatGram(totals.inputGram)}`}</SummaryRow>
          <SummaryRow label="Hasil utama G1">
            {`${mainCount} hasil, ${formatGram(
              preparationLinesTotals(
                [],
                input.outputs.filter(o => o.type === 'main'),
              ).outputGram,
            )}`}
          </SummaryRow>
          <SummaryRow label="Sampingan">
            {`${input.outputs.length - mainCount} hasil, ${formatGram(
              preparationLinesTotals(
                [],
                input.outputs.filter(o => o.type === 'byproduct'),
              ).outputGram,
            )}`}
          </SummaryRow>
          <SummaryRow label="Hilang" last>
            <Text variant="bodyStrong" color="danger">
              {lostText}
            </Text>
          </SummaryRow>
        </Card>
        <Text variant="small" color="textSecondary">
          Baris yang disiapkan diganti baris G1 hasilnya di batch {batch.batch_code}.
        </Text>
      </Dialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  list: { gap: space.sm },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  lineCard: { borderRadius: radius.card, padding: space.md, gap: space.xs, minHeight: sizes.touch },
  note: { padding: space.md, borderRadius: 8 },
  sheet: { paddingHorizontal: space.lg },
});

export default PreparationLines;
