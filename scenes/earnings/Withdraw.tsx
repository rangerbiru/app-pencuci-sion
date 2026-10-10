import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { useToast } from '@/components/elements/Toast';
import { space } from '@/theme';
import { Withdrawal } from '@/types';
import {
  toApiError,
  useCancelWithdrawalMutation,
  useCreateWithdrawalMutation,
  useGetBalanceQuery,
  useGetWithdrawalsQuery,
} from '@/services';
import { formatDateTime } from '@/utils/date';
import { formatRupiah } from '@/utils/format';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import TextField from '@/components/elements/TextField';
import { MoneyInput } from '@/components/elements/NumberInput';
import Chip from '@/components/elements/Chip';
import { toCents } from '@/utils/decimal';
import Button from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import Badge from '@/components/elements/Badge';
import { CountUp, HeroSurface, onHero } from '@/components/elements/Motion';
import Icon from '@/components/elements/Icon';
import { Dialog } from '@/components/elements/Dialog';
import { SkeletonList } from '@/components/elements/Skeleton';
import { EmptyState, ErrorState } from '@/components/elements/StateViews';
import { validateWithdrawAmount } from './withdrawForm';

function processedBy(w: Withdrawal): string {
  if (w.funded_by?.code === 'mandor') return `Diproses ${w.funded_by.label}`;
  return 'Diproses Admin SION';
}

function WithdrawalRow({
  w,
  onCancel,
  cancelling,
}: {
  w: Withdrawal;
  onCancel: (w: Withdrawal) => void;
  cancelling: boolean;
}) {
  const { colors } = useTheme();
  const when = w.paid_at ?? w.rejected_at ?? w.cancelled_at ?? w.approved_at ?? w.requested_at;
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.rowHead}>
        <View style={styles.flex}>
          <Text variant="numberM">{formatRupiah(w.amount, { style: 'whole' })}</Text>
          <Text variant="small" color="textSecondary">
            Diajukan {formatDateTime(w.requested_at)}
          </Text>
        </View>
        <Badge status={w.status} kind="withdrawal" />
      </View>
      <Text variant="small" color="textSecondary">
        {processedBy(w)}
        {w.status.code !== 'diajukan' ? `, ${formatDateTime(when)}` : ''}
        {w.method ? `, ${w.method}` : ''}
      </Text>
      {w.reject_reason ? (
        <Text variant="small" color="danger">
          Alasan ditolak: {w.reject_reason}
        </Text>
      ) : null}
      {w.status.code === 'diajukan' ? (
        <Button
          title="Batalkan pengajuan"
          variant="danger"
          onPress={() => onCancel(w)}
          isLoading={cancelling}
        />
      ) : null}
    </View>
  );
}

/** Tarik dana: nominal (maks saldo), konfirmasi, riwayat dan status, batalkan selama Diajukan. */
function Withdraw() {
  const { colors } = useTheme();
  const toast = useToast();
  const balance = useGetBalanceQuery();
  const history = useGetWithdrawalsQuery(1);
  const [create, createState] = useCreateWithdrawalMutation();
  const [cancel, cancelState] = useCancelWithdrawalMutation();
  const [amountText, setAmountText] = useState('');
  const [notes, setNotes] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Withdrawal | null>(null);

  const b = balance.data;
  const paidByMandor = b?.paid_by.code === 'mandor';
  const fund = paidByMandor ? b?.mandor_funds?.[0] : null;
  const available = paidByMandor
    ? (fund?.dapat_dicairkan ?? '0.00')
    : (b?.dapat_dicairkan ?? '0.00');
  const sourceLabel = paidByMandor ? `Mandor ${fund ? fund.mandor.name : ''}`.trim() : 'SION';
  const active =
    b?.withdrawal.active ??
    history.data?.data.find(w => w.status.code === 'diajukan' || w.status.code === 'disetujui') ??
    null;
  // rupiah dicairkan utuh: sen (bila ada) tidak ikut ditarik
  const availableCents = toCents(available) ?? 0n;
  const wholeAvailable = availableCents > 0n ? (availableCents / 100n).toString() : null;
  const canWithdraw = !!b && (b.withdrawal.can_withdraw || paidByMandor) && !active;

  function review() {
    if (!b) return;
    const res = validateWithdrawAmount(amountText, b.withdrawal.min_amount, available);
    if (!res.ok) {
      setFieldError(res.error);
      return;
    }
    setFieldError(undefined);
    setConfirm(res.amount);
  }

  async function submit() {
    if (!confirm) return;
    try {
      await create({ amount: confirm, notes: notes.trim() || undefined }).unwrap();
      setConfirm(null);
      setAmountText('');
      setNotes('');
      toast.show('Penarikan diajukan');
    } catch (e) {
      const err = toApiError(e);
      setConfirm(null);
      setFieldError(err.fieldErrors.amount ?? err.message);
    }
  }

  async function doCancel() {
    if (!cancelTarget) return;
    try {
      await cancel(cancelTarget.id).unwrap();
      toast.show('Pengajuan dibatalkan');
    } catch (e) {
      toast.show(toApiError(e).message, 'error');
    } finally {
      setCancelTarget(null);
    }
  }

  return (
    <Screen
      title="Tarik dana"
      back
      refreshing={(balance.isFetching || history.isFetching) && !balance.isLoading}
      onRefresh={() => {
        balance.refetch();
        history.refetch();
      }}
      footer={
        canWithdraw ? (
          <BottomBar>
            <Button title="Ajukan penarikan" onPress={review} style={styles.flex} />
          </BottomBar>
        ) : undefined
      }>
      {balance.isLoading ? (
        <SkeletonList rows={2} />
      ) : balance.error ? (
        <ErrorState error={toApiError(balance.error)} onRetry={balance.refetch} />
      ) : b ? (
        <>
          <HeroSurface>
            <Text type="small" style={{ color: onHero.muted }}>
              Saldo dapat dicairkan
            </Text>
            <CountUp
              value={available}
              formatted={formatRupiah(available, { style: 'whole' })}
              prefix="Rp "
              style={{ color: onHero.text }}
            />
            <Text type="small" style={{ color: onHero.muted }}>
              Sumber dana: {sourceLabel}. Minimal penarikan{' '}
              {formatRupiah(b.withdrawal.min_amount, { style: 'whole' })}.
            </Text>
          </HeroSurface>

          {active ? (
            <View style={[styles.note, { backgroundColor: colors.infoBg }]}>
              <Icon name="info" size={18} color={colors.info} />
              <Text variant="small" style={[styles.flex, { color: colors.info }]}>
                Masih ada pengajuan {active.status.label.toLowerCase()} sebesar{' '}
                {formatRupiah(active.amount, { style: 'whole' })}. Pengajuan baru bisa dibuat
                setelah itu selesai.
              </Text>
            </View>
          ) : !canWithdraw ? (
            <View style={[styles.note, { backgroundColor: colors.infoBg }]}>
              <Icon name="info" size={18} color={colors.info} />
              <Text variant="small" style={[styles.flex, { color: colors.info }]}>
                Penarikan belum bisa diajukan. Tanyakan ke Mandor atau Admin bila saldo seharusnya
                sudah ada.
              </Text>
            </View>
          ) : (
            <View style={styles.gap}>
              <MoneyInput
                label="Nominal"
                value={amountText}
                onChangeValue={v => {
                  setAmountText(v);
                  setFieldError(undefined);
                }}
                placeholder="100.000"
                hint={`Minimal ${formatRupiah(b.withdrawal.min_amount, { style: 'whole' })}, maksimal ${formatRupiah(available, { style: 'whole' })}.`}
                max={available}
                maxMessage={`Melebihi saldo (${formatRupiah(available, { style: 'whole' })}). Kurangi nominalnya.`}
                error={fieldError}
              />
              {wholeAvailable && wholeAvailable !== '0' ? (
                <Chip
                  label="Tarik semua"
                  icon="maximize-2"
                  selected={amountText === wholeAvailable}
                  accessibilityLabel={`Tarik semua, ${formatRupiah(wholeAvailable, { style: 'whole' })}`}
                  onPress={() => {
                    setAmountText(wholeAvailable);
                    setFieldError(undefined);
                  }}
                />
              ) : null}
              <TextField
                label="Catatan (boleh kosong)"
                value={notes}
                onChangeText={setNotes}
                placeholder="Contoh: transfer ke rekening BRI"
              />
            </View>
          )}
        </>
      ) : null}

      <Section title="Riwayat penarikan">
        {history.isLoading ? (
          <SkeletonList rows={2} />
        ) : history.error ? (
          <ErrorState error={toApiError(history.error)} onRetry={history.refetch} />
        ) : history.data && history.data.data.length > 0 ? (
          <Card style={styles.tight}>
            {history.data.data.map(w => (
              <WithdrawalRow
                key={w.id}
                w={w}
                onCancel={setCancelTarget}
                cancelling={cancelState.isLoading && cancelTarget?.id === w.id}
              />
            ))}
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon="dollar-sign"
              title="Belum ada penarikan"
              message="Pengajuan Anda akan muncul di sini beserta statusnya."
            />
          </Card>
        )}
      </Section>

      <Dialog
        visible={!!confirm}
        title={`Ajukan ${formatRupiah(confirm, { style: 'whole' })}?`}
        message={`Dana dari ${sourceLabel}. ${paidByMandor ? 'Mandor' : 'Admin'} akan memproses pengajuan ini.`}
        confirmLabel="Ya, ajukan"
        onConfirm={submit}
        onCancel={() => setConfirm(null)}
        isLoading={createState.isLoading}
      />
      <Dialog
        visible={!!cancelTarget}
        title="Batalkan pengajuan?"
        message={
          cancelTarget
            ? `Pengajuan ${formatRupiah(cancelTarget.amount, { style: 'whole' })} akan dibatalkan.`
            : undefined
        }
        confirmLabel="Ya, batalkan"
        confirmVariant="danger"
        cancelLabel="Tidak"
        onConfirm={doCancel}
        onCancel={() => setCancelTarget(null)}
        isLoading={cancelState.isLoading}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  tight: { paddingVertical: space.xs },
  row: { paddingVertical: space.md, gap: space.sm, borderBottomWidth: 1 },
  rowHead: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  note: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
});

export default Withdraw;
