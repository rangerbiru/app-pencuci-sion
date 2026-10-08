import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import { useToast } from '@/components/elements/Toast';
import { sizes, space } from '@/theme';
import { Submission } from '@/types';
import {
  toApiError,
  useApproveSubmissionMutation,
  useGetApprovalsQuery,
  useGetTeamWithdrawalsQuery,
  useGetWorkCardsQuery,
  useRejectSubmissionMutation,
} from '@/services';
import { isFeatureEnabled } from '@/utils/config';
import { useAppSlice } from '@/slices';
import { formatDate, formatTime } from '@/utils/date';
import { formatGram, formatPcs } from '@/utils/format';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Button from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import Icon from '@/components/elements/Icon';
import ListRow from '@/components/elements/ListRow';
import Segmented from '@/components/elements/Segmented';
import { PhotoThumb } from '@/components/elements/Photo';
import { ReasonDialog } from '@/components/elements/Dialog';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';

type Filter = 'semua' | 'ambil' | 'serah' | 'ulang';

const FILTER_TYPES: Record<Filter, string[]> = {
  semua: [],
  ambil: ['ambil_bahan'],
  serah: ['serah_lembab'],
  ulang: ['ambil_kerja_ulang', 'serah_kerja_ulang'],
};

function quantity(s: Submission) {
  return (
    [s.gram ? formatGram(s.gram) : null, s.pcs != null ? `${formatPcs(s.pcs)} pcs` : null]
      .filter(Boolean)
      .join(', ') || '-'
  );
}

/**
 * Verifikasi: antrean ambil bahan, serah hasil, dan kerja ulang anggota tim. Bisa menyetujui
 * beberapa sekaligus. Hasil timbang yang ditolak pencuci tampil di bawahnya.
 */
function Approvals({ back }: { back?: boolean }) {
  const { colors } = useTheme();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('semua');
  const [selected, setSelected] = useState<number[]>([]);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejectError, setRejectError] = useState<string | undefined>();
  const { user } = useAppSlice();
  const isMandor = user?.role.code === 'mandor';
  const approvals = useGetApprovalsQuery();
  const teamWithdrawals = useGetTeamWithdrawalsQuery(
    { status: 'diajukan' },
    { skip: !isMandor || !isFeatureEnabled('teamWithdrawals') },
  );
  const disputed = useGetWorkCardsQuery({}, { skip: !isFeatureEnabled('workCards') });
  const [approve] = useApproveSubmissionMutation();
  const [reject] = useRejectSubmissionMutation();

  const all = useMemo(() => approvals.data?.data ?? [], [approvals.data]);
  const items = useMemo(
    () => (filter === 'semua' ? all : all.filter(s => FILTER_TYPES[filter].includes(s.type.code))),
    [all, filter],
  );
  const disputedCards = (disputed.data?.data ?? []).filter(
    c => c.weighing_confirmation?.status.code === 'tidak_setuju',
  );

  const toggle = (id: number) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  async function approveSelected() {
    setBusy(true);
    let ok = 0;
    const failures: string[] = [];
    for (const id of selected) {
      try {
        await approve(id).unwrap();
        ok += 1;
      } catch (e) {
        const s = all.find(x => x.id === id);
        failures.push(`${s?.worker.name ?? id}: ${toApiError(e).message}`);
      }
    }
    setBusy(false);
    setSelected([]);
    if (failures.length) toast.show(`${ok} disetujui. Gagal: ${failures.join('; ')}`, 'error');
    else toast.show(`${ok} pengajuan disetujui`);
  }

  async function rejectSelected(reason: string) {
    setBusy(true);
    setRejectError(undefined);
    let ok = 0;
    for (const id of selected) {
      try {
        await reject({ id, reason }).unwrap();
        ok += 1;
      } catch (e) {
        setRejectError(toApiError(e).fieldErrors.reason ?? toApiError(e).message);
      }
    }
    setBusy(false);
    if (ok === selected.length) {
      setRejectOpen(false);
      setSelected([]);
      toast.show(`${ok} pengajuan ditolak`);
    }
  }

  return (
    <Screen
      title="Verifikasi"
      subtitle={approvals.data ? `${approvals.data.meta.total} menunggu` : undefined}
      back={back}
      refreshing={approvals.isFetching && !approvals.isLoading}
      onRefresh={() => {
        approvals.refetch();
        disputed.refetch();
      }}
      footer={
        selected.length > 0 ? (
          <BottomBar inTabs={!back}>
            <Button
              title={`Tolak ${selected.length}`}
              variant="danger"
              size="large"
              onPress={() => setRejectOpen(true)}
              style={styles.flexHalf}
            />
            <Button
              title={`Setujui ${selected.length}`}
              onPress={approveSelected}
              isLoading={busy}
              style={styles.flex}
            />
          </BottomBar>
        ) : undefined
      }>
      <Segmented
        accessibilityLabel="Jenis pengajuan"
        value={filter}
        onChange={f => {
          setFilter(f);
          setSelected([]);
        }}
        options={[
          { value: 'semua', label: 'Semua' },
          { value: 'ambil', label: 'Ambil' },
          { value: 'serah', label: 'Serah' },
          { value: 'ulang', label: 'Ulang' },
        ]}
      />

      {approvals.isLoading ? (
        <SkeletonList rows={4} />
      ) : approvals.error ? (
        <ErrorState error={toApiError(approvals.error)} onRetry={approvals.refetch} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="check-circle"
            title="Tidak ada pengajuan yang menunggu"
            message="Pengajuan baru dari anggota tim akan muncul di sini."
            actionLabel="Muat ulang"
            onAction={approvals.refetch}
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {items.length > 1 ? (
            <Button
              title={
                selected.length === items.length
                  ? 'Batal pilih semua'
                  : `Pilih semua (${items.length})`
              }
              variant="ghost"
              icon={selected.length === items.length ? 'x-square' : 'check-square'}
              onPress={() =>
                setSelected(selected.length === items.length ? [] : items.map(s => s.id))
              }
              style={styles.selectAll}
            />
          ) : null}
          {items.map(s => {
            const checked = selected.includes(s.id);
            return (
              <Card
                key={s.id}
                padded={false}
                style={[styles.item, checked && { borderColor: colors.accent, borderWidth: 2 }]}>
                <Pressable
                  onPress={() => toggle(s.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  accessibilityLabel={`Pilih ${s.worker.name}, ${s.type.label}, ${quantity(s)}`}
                  style={({ pressed }) => [
                    styles.check,
                    pressed && { backgroundColor: colors.pressed },
                  ]}>
                  <Icon
                    name={checked ? 'check-square' : 'square'}
                    size={26}
                    color={checked ? colors.accentPressed : colors.textSecondary}
                  />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.itemBody,
                    pressed && { backgroundColor: colors.pressed },
                  ]}
                  onPress={() =>
                    router.push({ pathname: '/verifikasi/[id]', params: { id: String(s.id) } })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Buka detail ${s.worker.name}, ${s.type.label}`}>
                  <PhotoThumb
                    uri={s.photo_url}
                    label={`Foto ${s.type.label} ${s.worker.name}`}
                    size={60}
                  />
                  <View style={styles.flex}>
                    <Text variant="bodyStrong">{s.worker.name}</Text>
                    <Badge status={s.type} kind="work_submission_type" icon="tag" />
                    <Text variant="bodyStrong" style={styles.tabular}>
                      {quantity(s)}
                    </Text>
                    <Text variant="small" color="textSecondary">
                      {formatDate(s.work_date)}, jam {formatTime(s.submitted_at)}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={colors.textSecondary} />
                </Pressable>
              </Card>
            );
          })}
        </View>
      )}

      {isMandor && isFeatureEnabled('teamWithdrawals') ? (
        <Card padded={false}>
          <ListRow
            title="Penarikan pencuci Borongan"
            subtitle={
              teamWithdrawals.data
                ? `${teamWithdrawals.data.meta.total} menunggu persetujuan`
                : 'Dari dana Mandor'
            }
            onPress={() => router.push('/penarikan-tim')}
            divider={false}
          />
        </Card>
      ) : null}

      {disputedCards.length > 0 ? (
        <Section
          title="Hasil timbang ditolak pencuci"
          description="Timbang ulang lalu simpan hasil standar lagi.">
          <Card padded={false}>
            {disputedCards.map((c, i) => (
              <ListRow
                key={c.id}
                title={c.worker.name}
                subtitle={`Kartu ${formatDate(c.work_date)}: ${c.weighing_confirmation?.reason ?? ''}`}
                right={
                  <Badge status={c.weighing_confirmation?.status} kind="weighing_confirmation" />
                }
                divider={i < disputedCards.length - 1}
                onPress={() =>
                  router.push({ pathname: '/kartu/[id]', params: { id: String(c.id) } })
                }
              />
            ))}
          </Card>
        </Section>
      ) : null}

      <ReasonDialog
        recipient="pencuci"
        visible={rejectOpen}
        title={`Tolak ${selected.length} pengajuan`}
        message="Alasan dikirim ke pencuci. Stok dan upah tidak berubah."
        confirmLabel="Tolak"
        onSubmit={rejectSelected}
        onCancel={() => setRejectOpen(false)}
        isLoading={busy}
        serverError={rejectError}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.xxs },
  flexHalf: { flex: 0.7 },
  list: { gap: space.sm },
  selectAll: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  item: { flexDirection: 'row', alignItems: 'stretch' },
  check: { width: sizes.touch + 8, alignItems: 'center', justifyContent: 'center' },
  itemBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingRight: space.md,
  },
  tabular: { fontVariant: ['tabular-nums'] },
});

export default Approvals;
