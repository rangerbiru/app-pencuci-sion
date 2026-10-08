import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { useToast } from '@/components/elements/Toast';
import { space } from '@/theme';
import {
  toApiError,
  useGetWorkCardQuery,
  useSubmitQcMutation,
  useVerifyCardMutation,
} from '@/services';
import { jakarta } from '@/utils/date';
import { formatGram, formatPcs } from '@/utils/format';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import TextField from '@/components/elements/TextField';
import Button from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import Segmented from '@/components/elements/Segmented';
import Icon from '@/components/elements/Icon';
import { Dialog } from '@/components/elements/Dialog';
import { SkeletonList } from '@/components/elements/Skeleton';
import { ErrorState } from '@/components/elements/StateViews';
import WorkCardSummary from './WorkCardSummary';
import { initialQcInput, QcErrors, QcInput, validateQc } from './qcForm';

const GROUP_LABEL: Record<string, string> = {
  utuh: 'Utuh',
  kecil: 'Kecil',
  hancur: 'Hancur',
  kotor: 'Kotor',
};

/** Detail kartu: hasil per baris (gram dan pcs bersih), QC Standard/Belum Standard, Verifikasi. */
function WorkCardDetail({ id }: { id: number }) {
  const { colors } = useTheme();
  const toast = useToast();
  const q = useGetWorkCardQuery(id);
  const [submitQc, qcState] = useSubmitQcMutation();
  const [verify, verifyState] = useVerifyCardMutation();
  const [input, setInput] = useState<QcInput | null>(null);
  const [errors, setErrors] = useState<QcErrors>({ rows: {} });
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmVerify, setConfirmVerify] = useState(false);
  const card = q.data;

  useEffect(() => {
    if (card) setInput(initialQcInput(card));
  }, [card]);

  if (q.isLoading || !input) {
    return (
      <Screen title="Kartu kerja" back>
        {q.error ? (
          <ErrorState error={toApiError(q.error)} onRetry={q.refetch} />
        ) : (
          <SkeletonList rows={4} />
        )}
      </Screen>
    );
  }
  if (!card) {
    return (
      <Screen title="Kartu kerja" back>
        <ErrorState error={toApiError(q.error)} onRetry={q.refetch} />
      </Screen>
    );
  }

  const locked = card.verified;
  const canVerify = !locked && card.qc_status?.code === 'standard';
  const weighingBlocks = ['menunggu', 'tidak_setuju'].includes(
    card.weighing_confirmation?.status.code ?? '',
  );

  async function saveQc() {
    if (!input || !card) return;
    setServerError(null);
    const res = validateQc(input, card);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    setErrors({ rows: {} });
    try {
      await submitQc({ id: card.id, body: res.payload }).unwrap();
      toast.show(
        res.payload.qc_status === 'standard'
          ? 'QC disimpan: Standard'
          : 'QC disimpan: Belum Standard, kerja ulang dibuat',
      );
    } catch (e) {
      const err = toApiError(e);
      setServerError(err.message);
      const rowErrors: Record<number, string> = {};
      Object.entries(err.fieldErrors).forEach(([k, v]) => {
        const m = /^outputs\.(\d+)\./.exec(k);
        if (m) rowErrors[Number(m[1])] = v;
      });
      setErrors({
        rows: rowErrors,
        reworkDate: err.fieldErrors.rework_date,
        status: err.fieldErrors.qc_status,
      });
    }
  }

  async function doVerify() {
    setServerError(null);
    try {
      await verify(card!.id).unwrap();
      setConfirmVerify(false);
      toast.show('Kartu terverifikasi');
    } catch (e) {
      setConfirmVerify(false);
      setServerError(toApiError(e).message);
    }
  }

  const quick = (n: number) => jakarta().add(n, 'day').format('DD/MM/YYYY');

  return (
    <Screen
      title={card.worker.name}
      subtitle="Kartu kerja dan QC"
      back
      refreshing={q.isFetching}
      onRefresh={q.refetch}
      footer={
        locked ? undefined : (
          <BottomBar>
            {canVerify ? (
              <Button
                title="Verifikasi"
                variant="secondary"
                size="large"
                icon="lock"
                onPress={() => setConfirmVerify(true)}
                style={styles.flexHalf}
              />
            ) : null}
            <Button
              title="Simpan QC"
              onPress={saveQc}
              isLoading={qcState.isLoading}
              style={styles.flex}
            />
          </BottomBar>
        )
      }>
      <WorkCardSummary card={card} />

      {locked ? (
        <View style={[styles.note, { backgroundColor: colors.successBg }]}>
          <Icon name="lock" size={18} color={colors.success} />
          <Text variant="small" style={[styles.flex, { color: colors.success }]}>
            Kartu sudah terverifikasi dan terkunci. Perubahan hanya lewat Admin di web.
          </Text>
        </View>
      ) : (
        <>
          <Section
            title="Hasil bersih per baris"
            description="Isi gram dan pcs bersih setelah ditimbang.">
            {card.result.rows.length === 0 ? (
              <Card>
                <Text variant="body" color="textSecondary">
                  Kartu ini belum punya baris hasil. Tambahkan baris hasil per item di Kartu Kerja
                  web, lalu isi QC di sini.
                </Text>
              </Card>
            ) : (
              <View style={styles.rows}>
                {card.result.rows.map((r, i) => (
                  <Card key={`${r.item_id}-${i}`} style={styles.rowCard}>
                    <View style={styles.rowHead}>
                      <Text variant="bodyStrong" style={styles.flex}>
                        {r.item}
                      </Text>
                      <Text variant="small" color="textSecondary">
                        {GROUP_LABEL[r.group] ?? r.group}
                        {r.pcs_lembab != null ? `, lembab ${formatPcs(r.pcs_lembab)} pcs` : ''}
                      </Text>
                    </View>
                    <View style={styles.inputs}>
                      <View style={styles.flex}>
                        <TextField
                          label="Gram bersih"
                          value={input.rows[i]?.gram ?? ''}
                          onChangeText={v =>
                            setInput(p =>
                              p
                                ? {
                                    ...p,
                                    rows: p.rows.map((x, j) => (j === i ? { ...x, gram: v } : x)),
                                  }
                                : p,
                            )
                          }
                          keyboardType="decimal-pad"
                          unit="gr"
                        />
                      </View>
                      <View style={styles.pcs}>
                        <TextField
                          label="Pcs bersih"
                          value={input.rows[i]?.pcs ?? ''}
                          onChangeText={v =>
                            setInput(p =>
                              p
                                ? {
                                    ...p,
                                    rows: p.rows.map((x, j) => (j === i ? { ...x, pcs: v } : x)),
                                  }
                                : p,
                            )
                          }
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                    {errors.rows[i] ? (
                      <Text variant="small" color="danger">
                        {errors.rows[i]}
                      </Text>
                    ) : null}
                  </Card>
                ))}
                <Text variant="small" color="textSecondary">
                  Total sekarang {formatGram(card.result.gram)}. Hasil yang diubah meminta
                  konfirmasi timbang ulang ke pencuci.
                </Text>
              </View>
            )}
          </Section>

          <Section title="Hasil QC">
            <Segmented
              accessibilityLabel="Hasil QC"
              value={input.status ?? ('' as 'standard')}
              onChange={v => setInput(p => (p ? { ...p, status: v } : p))}
              options={[
                { value: 'standard', label: 'Standard' },
                { value: 'belum_standard', label: 'Belum Standard' },
              ]}
            />
            {errors.status ? (
              <Text variant="small" color="danger">
                {errors.status}
              </Text>
            ) : null}
            {input.status === 'belum_standard' ? (
              <View style={styles.rework}>
                <View style={[styles.note, { backgroundColor: colors.dangerBg }]}>
                  <Icon name="repeat" size={18} color={colors.danger} />
                  <Text variant="small" style={[styles.flex, { color: colors.danger }]}>
                    Belum Standard membuat kerja ulang untuk {card.worker.name}. Upah kartu tertahan
                    sampai standar.
                  </Text>
                </View>
                <TextField
                  label="Tanggal kerja ulang"
                  value={input.reworkDate}
                  onChangeText={v => setInput(p => (p ? { ...p, reworkDate: v } : p))}
                  placeholder="dd/mm/yyyy"
                  keyboardType="numbers-and-punctuation"
                  error={errors.reworkDate}
                />
                <View style={styles.quick}>
                  {[0, 1, 2].map(n => (
                    <Button
                      key={n}
                      title={n === 0 ? 'Hari ini' : n === 1 ? 'Besok' : 'Lusa'}
                      variant="secondary"
                      onPress={() => setInput(p => (p ? { ...p, reworkDate: quick(n) } : p))}
                      style={styles.flex}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </Section>

          {canVerify && weighingBlocks ? (
            <Text variant="small" color="warning">
              Verifikasi akan ditolak selama hasil timbang belum dikonfirmasi pencuci atau ditolak.
            </Text>
          ) : null}
        </>
      )}

      {serverError ? (
        <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
          {serverError}
        </Text>
      ) : null}

      <Dialog
        visible={confirmVerify}
        title="Verifikasi kartu?"
        message="Kartu lolos QC menjadi terverifikasi dan terkunci, sama dengan tombol Verifikasi di web."
        confirmLabel="Ya, verifikasi"
        onConfirm={doVerify}
        onCancel={() => setConfirmVerify(false)}
        isLoading={verifyState.isLoading}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexHalf: { flex: 0.7 },
  rows: { gap: space.md },
  rowCard: { gap: space.sm },
  rowHead: { gap: 2 },
  inputs: { flexDirection: 'row', gap: space.sm },
  pcs: { width: 120 },
  rework: { gap: space.md },
  quick: { flexDirection: 'row', gap: space.sm },
  note: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
});

export default WorkCardDetail;
