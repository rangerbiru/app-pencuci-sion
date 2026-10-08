import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import useFieldSubmit from '@/hooks/useFieldSubmit';
import useNow from '@/hooks/useNow';
import { space } from '@/theme';
import { WorkCard } from '@/types';
import { submitWeighing } from '@/services/fieldActions';
import { formatDate, remainingText } from '@/utils/date';
import { formatGram } from '@/utils/format';
import Card from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import Button from '@/components/elements/Button';
import Badge from '@/components/elements/Badge';
import Amount from '@/components/elements/Amount';
import Icon from '@/components/elements/Icon';
import { Dialog, ReasonDialog } from '@/components/elements/Dialog';

const GROUP_LABEL: Record<string, string> = {
  utuh: 'Utuh',
  kecil: 'Kecil',
  hancur: 'Hancur',
  kotor: 'Kotor',
};

export interface WeighingCardProps {
  card: WorkCard;
  /** dipanggil setelah jawaban terkirim atau tersimpan */
  onAnswered?: () => void;
}

/**
 * Konfirmasi hasil timbang (Tahap 15B A4): Setuju / Tidak setuju + alasan wajib, dengan sisa
 * waktu sebelum dianggap setuju otomatis (`deadline` dari API).
 */
function WeighingCard({ card, onAnswered }: WeighingCardProps) {
  const { colors } = useTheme();
  const now = useNow(60000);
  const { submit, submitting, error, setError } = useFieldSubmit();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const wc = card.weighing_confirmation;
  const left = remainingText(wc?.deadline, now);

  async function answer(agree: boolean, reason?: string) {
    const outcome = await submit(
      () => submitWeighing({ cardId: card.id, agree, reason }),
      agree ? 'Hasil timbang disetujui' : 'Keberatan terkirim ke Kepala Pencuci',
    );
    if (outcome.status !== 'rejected') {
      setConfirmOpen(false);
      setRejectOpen(false);
      onAnswered?.();
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Text variant="subheading">Konfirmasi hasil timbang</Text>
          <Text variant="small" color="textSecondary">
            Kartu {formatDate(card.work_date)}
          </Text>
        </View>
        <Badge status={wc?.status} kind="weighing_confirmation" />
      </View>

      <View>
        <Text variant="small" color="textSecondary">
          Hasil bersih
        </Text>
        <Amount value={card.result.gram} unit="gram" size="l" />
      </View>

      <View style={styles.groups}>
        {card.result.groups.map(g => (
          <View key={g.group} style={[styles.group, { borderColor: colors.border }]}>
            <Text variant="small" color="textSecondary">
              {GROUP_LABEL[g.group] ?? g.group}
            </Text>
            <Text variant="bodyStrong" style={styles.tabular}>
              {formatGram(g.gram)}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.note, { backgroundColor: colors.warningBg }]}>
        <Icon name="clock" size={18} color={colors.warning} />
        <Text variant="small" style={[styles.flex, { color: colors.warning }]}>
          {left
            ? `Sisa ${left}. Bila tidak dijawab, hasil dianggap setuju otomatis.`
            : 'Batas waktu sudah lewat. Hasil akan dianggap setuju otomatis.'}
        </Text>
      </View>

      {error ? (
        <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
          {error.message}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Tidak setuju"
          variant="danger"
          size="large"
          onPress={() => setRejectOpen(true)}
          style={styles.flex}
        />
        <Button title="Setuju" onPress={() => setConfirmOpen(true)} style={styles.flex} />
      </View>

      <Dialog
        visible={confirmOpen}
        title="Setuju hasil timbang?"
        message={`Hasil bersih ${formatGram(card.result.gram)} untuk kartu ${formatDate(card.work_date)}. Upah dihitung dari hasil ini.`}
        confirmLabel="Ya, setuju"
        onConfirm={() => answer(true)}
        onCancel={() => {
          setConfirmOpen(false);
          setError(null);
        }}
        isLoading={submitting}
      />
      <ReasonDialog
        visible={rejectOpen}
        title="Tidak setuju"
        message="Tulis apa yang salah. Kepala Pencuci akan menimbang ulang."
        confirmLabel="Kirim keberatan"
        onSubmit={reason => answer(false, reason)}
        onCancel={() => {
          setRejectOpen(false);
          setError(null);
        }}
        isLoading={submitting}
        serverError={error?.fieldErrors.reason ?? error?.message}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.md },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  flex: { flex: 1 },
  groups: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  group: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    minWidth: '47%',
    flexGrow: 1,
  },
  tabular: { fontVariant: ['tabular-nums'] },
  note: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  actions: { flexDirection: 'row', gap: space.sm },
});

export default WeighingCard;
