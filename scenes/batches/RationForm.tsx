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
import { GRADE_NOT_READY, RationLineInput, needsPreparation, validateRations } from './rationForm';

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
  if (needsPreparation(batch)) {
    return (
      <Screen title="Penjatahan" subtitle={`${batch.batch_code}, ${batch.item}`} back>
        <BatchFlags grade={batch.grade} needsPreparation />
        <EmptyState
          icon="layers"
          title="Stok belum G1"
          message="Hanya stok Grade 1 yang bisa dijatahkan. Siapkan dulu, lalu jatahkan hasilnya."
          actionLabel={isFeatureEnabled('preparation') ? 'Siapkan dulu' : 'Kembali'}
          onAction={isFeatureEnabled('preparation') ? goPrepare : () => router.back()}
        />
      </Screen>
    );
  }

  const remaining = batch.remaining_gram ?? '0.00';
  const result = validateRations(lines, remaining);

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
    if (!result.ok) return;
    try {
      await create({ production_batch_id: batch!.id, lines: result.lines }).unwrap();
      toast.show('Penjatahan disimpan');
      router.back();
    } catch (e) {
      const err = toApiError(e);
      if (err.code === GRADE_NOT_READY) setGradeBlocked(err.message);
      else setServerError(err.message);
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
      <BatchFlags grade={batch.grade} />
      <Card style={styles.summary}>
        <View style={styles.flex}>
          <Text variant="small" color="textSecondary">
            Sisa belum dijatah
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

      <Section title="Pilih pencuci" description="Ketuk nama untuk menambah atau menghapus.">
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
            {isFeatureEnabled('preparation') ? (
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
});

export default RationForm;
