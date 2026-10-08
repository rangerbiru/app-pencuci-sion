import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import { space } from '@/theme';
import Card from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import Button from '@/components/elements/Button';
import Icon from '@/components/elements/Icon';
import { isFeatureEnabled } from '@/utils/config';
import { StepState, TodayModel } from './todaySteps';

export interface TodayCardProps {
  model: TodayModel;
  onRefresh: () => void;
}

const ROUTES = {
  check_in: '/absen?mode=masuk',
  take: '/ambil-bahan',
  hand_over: '/serah-hasil',
  check_out: '/absen?mode=pulang',
} as const;

function StepMarker({ state, index }: { state: StepState; index: number }) {
  const { colors } = useTheme();
  if (state === 'done') {
    return (
      <View
        style={[styles.marker, { backgroundColor: colors.success, borderColor: colors.success }]}>
        <Icon name="check" size={18} color={colors.surface} />
      </View>
    );
  }
  if (state === 'waiting' || state === 'queued') {
    return (
      <View
        style={[styles.marker, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
        <Icon
          name={state === 'queued' ? 'upload-cloud' : 'clock'}
          size={16}
          color={colors.warning}
        />
      </View>
    );
  }
  if (state === 'rejected') {
    return (
      <View
        style={[styles.marker, { backgroundColor: colors.dangerBg, borderColor: colors.danger }]}>
        <Icon name="x" size={16} color={colors.danger} />
      </View>
    );
  }
  const active = state === 'active';
  return (
    <View
      style={[
        styles.marker,
        {
          backgroundColor: active ? colors.accent : colors.surface,
          borderColor: active ? colors.accent : colors.borderStrong,
        },
      ]}>
      <Text
        variant="smallStrong"
        style={{ color: active ? colors.onAccent : colors.textSecondary }}>
        {index + 1}
      </Text>
    </View>
  );
}

const STATE_TEXT: Record<StepState, string> = {
  done: 'selesai',
  waiting: 'menunggu disetujui',
  queued: 'belum terkirim',
  rejected: 'ditolak',
  active: 'langkah sekarang',
  todo: 'belum',
};

/**
 * Kartu "Hari ini": rel langkah kerja nyata dengan satu tombol besar untuk langkah berikutnya.
 */
function TodayCard({ model, onRefresh }: TodayCardProps) {
  const { colors } = useTheme();
  const { steps, next, reworkOffers, canTakeMore, canCheckOutEarly } = model;

  return (
    <Card raised style={styles.card}>
      <Text variant="subheading" accessibilityRole="header">
        Hari ini
      </Text>
      <View>
        {steps.map((s, i) => {
          const last = i === steps.length - 1;
          const emphasized = s.state === 'active' || s.state === 'rejected';
          return (
            <View
              key={s.key}
              style={styles.step}
              accessible
              accessibilityLabel={`Langkah ${i + 1}, ${s.title}, ${STATE_TEXT[s.state]}${s.detail ? `. ${s.detail}` : ''}`}>
              <View style={styles.rail}>
                <StepMarker state={s.state} index={i} />
                {!last ? (
                  <View
                    style={[
                      styles.line,
                      { backgroundColor: s.state === 'done' ? colors.success : colors.border },
                    ]}
                  />
                ) : null}
              </View>
              <View style={[styles.stepText, !last && styles.stepGap]}>
                <Text
                  variant={emphasized ? 'bodyStrong' : 'body'}
                  color={s.state === 'todo' ? 'textSecondary' : 'text'}>
                  {s.title}
                </Text>
                {s.detail ? (
                  <Text
                    variant="small"
                    color={
                      s.state === 'rejected'
                        ? 'danger'
                        : s.state === 'queued' || s.state === 'waiting'
                          ? 'warning'
                          : 'textSecondary'
                    }>
                    {s.detail}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      {next.kind === 'refresh' ? (
        <View style={[styles.note, { backgroundColor: colors.warningBg }]}>
          <Icon name="clock" size={18} color={colors.warning} />
          <Text variant="small" style={[styles.flex, { color: colors.warning }]}>
            {next.reason}
          </Text>
        </View>
      ) : null}

      {next.kind === 'done' ? (
        <View style={[styles.note, { backgroundColor: colors.successBg }]}>
          <Icon name="check-circle" size={18} color={colors.success} />
          <Text variant="smallStrong" style={[styles.flex, { color: colors.success }]}>
            Kerja hari ini selesai. Terima kasih.
          </Text>
        </View>
      ) : next.kind === 'refresh' ? (
        <Button title={next.label} icon="refresh-cw" onPress={onRefresh} />
      ) : (
        <Button title={next.label} onPress={() => router.push(ROUTES[next.kind])} />
      )}

      {reworkOffers.length > 0 && isFeatureEnabled('rework') ? (
        <View style={styles.secondary}>
          {reworkOffers.map(o => (
            <Button
              key={`${o.kind}-${o.rework.id}`}
              title={`${o.label}, ${o.rework.pcs ?? '-'} pcs`}
              variant="secondary"
              icon="repeat"
              onPress={() =>
                router.push({
                  pathname: '/kerja-ulang',
                  params: {
                    mode: o.kind === 'take_rework' ? 'ambil' : 'serah',
                    id: String(o.rework.id),
                  },
                })
              }
            />
          ))}
        </View>
      ) : null}

      {canTakeMore && next.kind !== 'take' ? (
        <Button
          title="Ambil bahan lagi"
          variant="ghost"
          icon="plus"
          onPress={() => router.push('/ambil-bahan')}
        />
      ) : null}

      {canCheckOutEarly ? (
        <Button
          title="Absen pulang sekarang"
          variant="ghost"
          icon="log-out"
          onPress={() => router.push(ROUTES.check_out)}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.lg },
  step: { flexDirection: 'row', gap: space.md },
  rail: { alignItems: 'center', width: 32 },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { width: 2, flex: 1, minHeight: 16 },
  stepText: { flex: 1, paddingTop: 4, gap: 2 },
  stepGap: { paddingBottom: space.lg },
  note: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  flex: { flex: 1 },
  secondary: { gap: space.sm },
});

export default TodayCard;
