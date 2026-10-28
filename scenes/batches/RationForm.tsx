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
import { compareDecimal, subDecimal } from '@/utils/decimal';
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
import BatchLines, { LineBadge, lineTitle } from './BatchLines';
import {
  GRADE_NOT_READY,
  LINE_REQUIRED,
  RationLineInput,
  needsPreparation,
  validateRations,
} from './rationForm';
import {
  batchLines,
  lineItemName,
  notaText,
  preparableLines,
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
  const [lines, setLines] = useState<RationLineInput[]>([]);
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
  if (blocked && hasLines && preparableLines(batch).length === 0) {
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

  function toggle(workerId: number) {
    setLines(prev =>
      prev.some(l => l.workerId === workerId)
        ? prev.filter(l => l.workerId !== workerId)
        : [...prev, { workerId, gram: '' }],
    );
  }

  async function save() {
    setShown(true);
    setServerError(null);
    setGradeBlocked(null);
    if (!result.ok || lineError) return;
    try {
      await create({ production_batch_id: batch!.id, lines: result.lines }).unwrap();
      toast.show('Penjatahan disimpan');
      router.back();
    } catch (e) {
      const err = toApiError(e);
      if (err.code === GRADE_NOT_READY) setGradeBlocked(err.message);
      else {
        // line_required: pesan server apa adanya; pilihan baris sudah tampil di atas
        if (err.code === LINE_REQUIRED) setLineId(null);
        setServerError(err.message);
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
                    accessibilityLabel={`${lineTitle(l)}, Grade ${l.grade ?? '-'}, sisa ${formatGram(l.sisa_dijatah ?? l.gram)}${pickable ? '' : ', perlu penyiapan, tidak bisa dipilih'}`}
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
                        {lineItemName(l.item)}
                      </Text>
                      <Text variant="bodyStrong">{formatGram(l.sisa_dijatah ?? l.gram)}</Text>
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
        title={hasLines ? '2. Pilih pencuci' : 'Pilih pencuci'}
        description="Ketuk nama untuk menambah atau menghapus.">
        {workers.length === 0 ? (
          <Card>
            <EmptyState
              icon="users"
              title="Belum ada pencuci di tim"
              message="Hubungi Admin untuk menambahkan anggota tim."
            />
          </Card>
        ) : (
          <View style={styles.chips}>
            {workers.map(w => {
              const active = lines.some(l => l.workerId === w.id);
              return (
                <Pressable
                  key={w.id}
                  onPress={() => toggle(w.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={w.name}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      borderColor: active ? colors.fieldFocus : colors.fieldBorder,
                      backgroundColor: active
                        ? colors.navIndicator
                        : pressed
                          ? colors.pressed
                          : colors.surface,
                    },
                  ]}>
                  <Icon
                    name={active ? 'check-square' : 'square'}
                    size={18}
                    color={active ? colors.onNavIndicator : colors.textSecondary}
                  />
                  <Text variant="bodyStrong">{w.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Section>

      {lines.length > 0 ? (
        <Section title="Target gram per pencuci">
          <View style={styles.lines}>
            {lines.map((l, i) => {
              const w = workers.find(x => x.id === l.workerId);
              return (
                <GramInput
                  key={l.workerId ?? i}
                  label={w?.name ?? 'Pencuci'}
                  value={l.gram}
                  onChangeValue={g =>
                    setLines(prev => prev.map((x, j) => (j === i ? { ...x, gram: g } : x)))
                  }
                  placeholder="0"
                  error={shown ? result.errors[i] : undefined}
                />
              );
            })}
          </View>
        </Section>
      ) : null}

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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: sizes.touch,
    paddingHorizontal: space.lg,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  lines: { gap: space.md },
  lineCard: { borderRadius: radius.card, padding: space.md, gap: space.xs, minHeight: sizes.touch },
  lineHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});

export default RationForm;
