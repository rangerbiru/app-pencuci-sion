import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import useNow from '@/hooks/useNow';
import useTheme from '@/hooks/useTheme';
import { duration, easing, space } from '@/theme';
import { Attendance } from '@/types';
import { formatTime, jakarta } from '@/utils/date';
import Text from '@/components/elements/Text';
import Icon from '@/components/elements/Icon';
import { HeroSurface, onHero, PressableScale, ProgressBarV2 } from '@/components/elements/Motion';

const WORKDAY_MIN = 8 * 60;

/** Jam berjalan per detik. Dipisah dan di-memo supaya hanya teks jam yang dirender ulang. */
const LiveClock = memo(function LiveClock() {
  const now = useNow(1000);
  return (
    <Text
      type="clock"
      numberOfLines={1}
      maxFontSizeMultiplier={1.1}
      style={{ color: onHero.text }}
      accessibilityLabel={`Jam server ${now.format('HH:mm')}`}>
      {now.format('HH:mm:ss')}
    </Text>
  );
});

function durationText(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} j ${m} m` : `${m} m`;
}

/** Kotak kaca Masuk / Pulang berisi jam. */
function TimePill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text type="small" style={{ color: onHero.muted }}>
        {label}
      </Text>
      <Text type="number" style={{ color: onHero.text }}>
        {value}
      </Text>
    </View>
  );
}

/**
 * Kartu absen (aksi paling menonjol di Beranda Pencuci): jam berjalan, tanggal, tombol absen bulat
 * yang berdenyut halus selama menunggu ditekan, jam masuk/pulang, dan durasi kerja.
 */
function AttendanceHero({
  attendance,
  queuedIn,
  queuedOut,
}: {
  attendance: Attendance | null | undefined;
  queuedIn: boolean;
  queuedOut: boolean;
}) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const now = useNow(60000);
  const inAt = attendance?.check_in.at ?? null;
  const outAt = attendance?.check_out.at ?? null;
  const checkedIn = !!inAt || queuedIn;
  const done = !!outAt || queuedOut;
  const action = !checkedIn ? 'masuk' : !done ? 'pulang' : null;

  const worked = inAt
    ? Math.max(0, (outAt ? jakarta(outAt) : now).diff(jakarta(inAt), 'minute'))
    : 0;

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (action === 'masuk' && !reduce) {
      pulse.set(
        withRepeat(
          withSequence(
            withTiming(1.04, { duration: duration.pulse / 2, easing: easing.inOut }),
            withTiming(1, { duration: duration.pulse / 2, easing: easing.inOut }),
          ),
          -1,
        ),
      );
    } else {
      cancelAnimation(pulse);
      pulse.set(1);
    }
    return () => cancelAnimation(pulse);
  }, [action, reduce, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.get() }] }));

  const label =
    action === 'masuk' ? 'Absen masuk' : action === 'pulang' ? 'Absen pulang' : 'Selesai';

  return (
    <HeroSurface>
      <View style={styles.top}>
        <View style={styles.flex}>
          <Text type="small" style={{ color: onHero.muted }}>
            Jam server
          </Text>
          <LiveClock />
          <Text type="small" style={{ color: onHero.muted }}>
            {action === 'masuk'
              ? 'Belum absen masuk hari ini'
              : action === 'pulang'
                ? queuedIn && !inAt
                  ? 'Absen masuk belum terkirim'
                  : 'Sedang bekerja'
                : 'Kerja hari ini selesai'}
          </Text>
        </View>
        <Animated.View style={pulseStyle}>
          <PressableScale
            disabled={!action}
            onPress={() => action && router.push(`/absen?mode=${action}`)}
            accessibilityLabel={label}
            style={[styles.button, { backgroundColor: action ? colors.accent : onHero.glass }]}>
            <Icon
              name={action === 'masuk' ? 'log-in' : action === 'pulang' ? 'log-out' : 'check'}
              size={28}
              color={action ? colors.onAccent : onHero.text}
            />
            <Text
              type="caption"
              style={{ color: action ? colors.onAccent : onHero.text }}
              maxFontSizeMultiplier={1.15}>
              {action === 'masuk' ? 'Masuk' : action === 'pulang' ? 'Pulang' : 'Selesai'}
            </Text>
          </PressableScale>
        </Animated.View>
      </View>

      <View style={styles.pills}>
        <TimePill label="Masuk" value={inAt ? formatTime(inAt) : queuedIn ? 'antre' : '--:--'} />
        <TimePill
          label="Pulang"
          value={outAt ? formatTime(outAt) : queuedOut ? 'antre' : '--:--'}
        />
      </View>

      <View style={styles.gap}>
        <ProgressBarV2
          value={worked / WORKDAY_MIN}
          color={colors.accent}
          trackColor={onHero.track}
          accessibilityLabel={`Durasi kerja ${durationText(worked)} dari 8 jam`}
        />
        <Text type="small" style={{ color: onHero.muted }}>
          {inAt
            ? `${durationText(worked)} kerja hari ini`
            : 'Durasi kerja mulai dihitung saat absen masuk'}
        </Text>
      </View>
    </HeroSurface>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: space.xxs },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  button: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pills: { flexDirection: 'row', gap: space.sm },
  pill: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: onHero.glass,
    borderWidth: 1,
    borderColor: onHero.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gap: { gap: space.sm },
});

export default AttendanceHero;
