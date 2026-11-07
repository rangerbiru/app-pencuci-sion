import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import { useToast } from '@/components/elements/Toast';
import { radius, sizes, space } from '@/theme';
import {
  toApiError,
  useCreateRationsMutation,
  useGetRationBatchesQuery,
  useGetTeamQuery,
} from '@/services';
import { formatGram } from '@/utils/format';
import { isFeatureEnabled } from '@/utils/config';
import { compareDecimal, parseUserDecimal, subDecimal } from '@/utils/decimal';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import { GramInput } from '@/components/elements/NumberInput';
import Button from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import Amount from '@/components/elements/Amount';
import Icon from '@/components/elements/Icon';
import { SkeletonDetail } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';
import BatchFlags from './BatchFlags';
import BatchLines, { Komposisi, LineBadge, lineTitle } from './BatchLines';
import WorkerPicker from './WorkerPicker';
import {
  GRADE_NOT_READY,
  LINE_REQUIRED,
  RationLineInput,
  needsPreparation,
  rowErrorsFromServer,
  validateRations,
} from './rationForm';
import {
  batchLines,
  lineGradeText,
  lineName,
  perkiraanHasil,
  mustPrepareLines,
  notaText,
  rationableLines,
} from '@/utils/batchLines';

/** Penjatahan: buat jatah (box) per pencuci dari batch yang sudah diterima. */
function RationForm({ batchId }: { batchId: number }) {
  const { colors } = useTheme();
  const toast = useToast();
  const batches = useGetRationBatchesQuery();
  const team = useGetTeamQuery();
  const [create, state] = useCreateRationsMutation();
  const batch = batches.data?.find(b => b.id === batchId);
  const workers = (team.data ?? []).filter(m => m.role.code === 'pencuci');
  const [lines, setLines] = useState<RationLineInput[]>([{ workerId: null, gram: '' }]);
  // 422 per baris dari server (allocations.N.*)
  const [rowServerErrors, setRowServerErrors] = useState<Record<number, string>>({});
  const [shown, setShown] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  // 422 grade_not_ready: pesan server + tombol Siapkan dulu, bukan galat umum
  const [gradeBlocked, setGradeBlocked] = useState<string | null>(null);
  // revisi 26/10: baris G1 yang dijatahkan (item + nota)
  const [lineId, setLineId] = useState<number | null>(null);

  if (batches.isLoading || team.isLoading) {
    return (
      <Screen title="Penjatahan" back>
        <SkeletonDetail facts={3} photo={false} />
      </Screen>
    );
  }
  if (batches.error || team.error) {
    return (
      <Screen title="Penjatahan" back>
        <ErrorState
          error={toApiError(batches.error ?? team.error)}
          onRetry={() => (batches.refetch(), team.refetch())}
        />
      </Screen>
    );
  }
  if (!batch) {
    return (
      <Screen title="Penjatahan" back>
        <EmptyState
          icon="package"
          title="Batch tidak ditemukan"
          actionLabel="Kembali"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const goPrepare = () =>
    router.replace({ pathname: '/batch/siapkan/[id]', params: { id: String(batch.id) } });
  const canPrepare = batch.can_prepare && isFeatureEnabled('preparation');
  // batch berisi lines[]: yang menentukan baris G1; tanpa lines[] (server lama) tetap per batch
  const hasLines = batchLines(batch).length > 0;
  const rationable = rationableLines(batch);
  const blocked = hasLines ? rationable.length === 0 : needsPreparation(batch);
  if (blocked && hasLines && mustPrepareLines(batch).length === 0) {
    return (
      <Screen title="Penjatahan" subtitle={`${batch.batch_code}, ${batch.item}`} back>
        <EmptyState
          icon="check-circle"
          title="Seluruh gram sudah dijatahkan"
          message="Tidak ada baris G1 yang tersisa untuk dijatahkan."
          actionLabel="Kembali"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }
  if (blocked) {
    return (
      <Screen title="Penjatahan" subtitle={`${batch.batch_code}, ${batch.item}`} back>
        <BatchFlags grade={batch.grade} needsPreparation />
        <EmptyState
          icon="layers"
          title="Stok belum G1"
          message="Hanya stok Grade 1 yang bisa dijatahkan. Siapkan dulu, lalu jatahkan hasilnya."
          actionLabel={canPrepare ? 'Siapkan dulu' : 'Kembali'}
          onAction={canPrepare ? goPrepare : () => router.back()}
        />
      </Screen>
    );
  }

  // satu-satunya baris G1 yang bisa dijatah dipilih otomatis; batch lama tanpa lines[] tanpa baris
  const selectedLine = hasLines
    ? (rationable.find(l => l.id === lineId) ?? (rationable.length === 1 ? rationable[0] : null))
    : null;
  const remaining = (selectedLine?.sisa_dijatah ?? batch.remaining_gram) || '0.00';
  const result = validateRations(lines, remaining, selectedLine?.id);
  const lineError =
    hasLines && !selectedLine ? 'Pilih baris (item dan nota) yang dijatahkan.' : null;

  function updateRow(i: number, patch: Partial<RationLineInput>) {
    setRowServerErrors({});
    setLines(prev => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  function removeRow(i: number) {
    setRowServerErrors({});
    setLines(prev => prev.filter((_, j) => j !== i));
  }

  async function save() {
    setShown(true);
    setServerError(null);
    setGradeBlocked(null);
    setRowServerErrors({});
    if (!result.ok || lineError) return;
    try {
      // stok gabungan: bentuk split baru; batch lama tetap bentuk lama
      await create(
        selectedLine?.stok_gabungan
          ? {
              production_batch_id: batch!.id,
              batch_line_id: selectedLine.id,
              allocations: result.allocations,
            }
          : { production_batch_id: batch!.id, lines: result.lines },
      ).unwrap();
      toast.show('Penjatahan disimpan');
      router.back();
    } catch (e) {
      const err = toApiError(e);
      if (err.code === GRADE_NOT_READY) setGradeBlocked(err.message);
      else {
        // line_required: pesan server apa adanya; pilihan baris sudah tampil di atas
        if (err.code === LINE_REQUIRED) setLineId(null);
        const rows = rowErrorsFromServer(err.fieldErrors);
        setRowServerErrors(rows);
        // pesan umum hanya bila tidak ada pesan per baris
        setServerError(Object.keys(rows).length > 0 ? null : err.message);
      }
    }
  }

  return (
    <Screen
      title="Penjatahan"
      subtitle={`${batch.batch_code}, ${batch.item}`}
      back
      footer={
        <BottomBar>
          <Button
            title="Simpan penjatahan"
            onPress={save}
            isLoading={state.isLoading}
            style={styles.flex}
          />
        </BottomBar>
      }>
      {hasLines ? null : <BatchFlags grade={batch.grade} />}
      {batch.target_hasil ? <BatchLines batch={{ target_hasil: batch.target_hasil }} /> : null}
      {hasLines ? (
        <Section
          title="1. Pilih baris G1"
          description="Pilih stok (item dan nota) yang dijatahkan. Baris Grade 2/3 harus disiapkan dulu.">
          <View style={styles.lines}>
            {batchLines(batch)
              .filter(l => !l.prepared)
              .map(l => {
                const pickable = rationable.some(r => r.id === l.id);
                const active = selectedLine?.id === l.id;
                return (
                  <Pressable
                    key={l.id}
                    disabled={!pickable}
                    onPress={() => {
                      setLineId(l.id);
                      setServerError(null);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active, disabled: !pickable }}
                    accessibilityLabel={`${lineTitle(l)}, ${lineGradeText(l) ?? 'tanpa grade'}, sisa ${formatGram(l.sisa_dijatah ?? l.gram)}${pickable ? '' : ', perlu penyiapan, tidak bisa dipilih'}`}
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
                        opacity: pickable ? 1 : 0.55,
                      },
                    ]}>
                    <View style={styles.lineHead}>
                      <Icon
                        name={active ? 'check-circle' : 'circle'}
                        size={20}
                        color={active ? colors.onNavIndicator : colors.textSecondary}
                      />
                      <Text variant="bodyStrong" style={styles.flex}>
                        {lineName(l)}
                      </Text>
                      <Text variant="bodyStrong">{formatGram(l.sisa_dijatah ?? l.gram)}</Text>
                    </View>
                    <Text variant="small" color={active ? 'onNavIndicator' : 'textSecondary'}>
                      {[l.stok_gabungan ? null : notaText(l.nota), lineGradeText(l)]
                        .filter(Boolean)
                        .join(' · ') || 'Tanpa nota'}
                    </Text>
                    <LineBadge line={l} />
                    <Komposisi line={l} />
                  </Pressable>
                );
              })}
          </View>
          {shown && lineError ? (
            <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
              {lineError}
            </Text>
          ) : null}
        </Section>
      ) : null}
      <Card style={styles.summary}>
        <View style={styles.flex}>
          <Text variant="small" color="textSecondary">
            {selectedLine ? 'Sisa dijatah (baris)' : 'Sisa belum dijatah'}
          </Text>
          <Amount value={remaining} unit="gram" size="l" />
        </View>
        <View style={styles.flex}>
          <Text variant="small" color="textSecondary">
            Total dijatah
          </Text>
          <Text
            variant="numberM"
            color={compareDecimal(result.total, remaining) > 0 ? 'danger' : 'text'}>
            {formatGram(result.total)}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text variant="small" color="textSecondary">
            Sisa setelah ini
          </Text>
          <Text
            variant="numberM"
            color={compareDecimal(result.total, remaining) > 0 ? 'danger' : 'text'}>
            {formatGram(subDecimal(remaining, result.total))}
          </Text>
        </View>
      </Card>

      <Section
        title={hasLines ? '2. Isi pencuci dan Gram Jatah' : 'Isi pencuci dan Gram Jatah'}
        description="Satu baris per pencuci. Total tidak boleh melebihi sisa.">
        {workers.length === 0 ? (
          <Card>
            <EmptyState
              icon="users"
              title="Belum ada pencuci di tim"
              message="Hubungi Admin untuk menambahkan anggota tim."
            />
          </Card>
        ) : (
          <View style={styles.lines}>
            {lines.map((l, i) => {
              const est = perkiraanHasil(
                parseUserDecimal(l.gram),
                selectedLine?.perkiraan_rendemen,
              );
              const rowError = shown
                ? (result.errors[i] ?? rowServerErrors[i])
                : rowServerErrors[i];
              return (
                <Card key={i} style={styles.rowCard}>
                  <View style={styles.rowHead}>
                    <View style={styles.flex}>
                      <WorkerPicker
                        label="Nama Pencuci"
                        workers={workers}
                        value={l.workerId}
                        usedIds={lines.map(x => x.workerId).filter((x): x is number => x !== null)}
                        onChange={id => updateRow(i, { workerId: id })}
                      />
                    </View>
                    {lines.length > 1 ? (
                      <Pressable
                        onPress={() => removeRow(i)}
                        accessibilityRole="button"
                        accessibilityLabel={`Hapus baris pencuci ${i + 1}`}
                        hitSlop={8}
                        style={styles.remove}>
                        <Icon name="trash-2" size={20} color={colors.danger} />
                      </Pressable>
                    ) : null}
                  </View>
                  <GramInput
                    label="Gram Jatah"
                    value={l.gram}
                    onChangeValue={g => updateRow(i, { gram: g })}
                    placeholder="0"
                    error={rowError}
                  />
                  {selectedLine?.stok_gabungan ? (
                    <Text variant="small" color="textSecondary">
                      Perkiraan hasil:{' '}
                      <Text variant="smallStrong">{est ? formatGram(est) : '–'}</Text>
                      {est == null && selectedLine.perkiraan_rendemen_catatan
                        ? ` (${selectedLine.perkiraan_rendemen_catatan})`
                        : ''}
                    </Text>
                  ) : null}
                </Card>
              );
            })}
            <Button
              title="+ Tambah pencuci"
              variant="secondary"
              onPress={() => setLines(prev => [...prev, { workerId: null, gram: '' }])}
            />
          </View>
        )}
      </Section>

      {shown && result.totalError ? (
        <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
          {result.totalError}
        </Text>
      ) : null}
      {gradeBlocked ? (
        <Card style={[styles.summary, { backgroundColor: colors.dangerBg }]}>
          <View style={styles.flex}>
            <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
              {gradeBlocked}
            </Text>
            {canPrepare ? (
              <Button title="Siapkan dulu" variant="secondary" icon="layers" onPress={goPrepare} />
            ) : null}
          </View>
        </Card>
      ) : null}
      {serverError ? (
        <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
          {serverError}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summary: { flexDirection: 'row', gap: space.md },
  lines: { gap: space.md },
  lineCard: { borderRadius: radius.card, padding: space.md, gap: space.xs, minHeight: sizes.touch },
  lineHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rowHead: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  rowCard: { gap: space.md },
  remove: {
    minHeight: sizes.input,
    minWidth: sizes.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RationForm;
