import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import useNow from '@/hooks/useNow';
import useLocation from '@/hooks/useLocation';
import useFieldSubmit from '@/hooks/useFieldSubmit';
import { sizes, space } from '@/theme';
import { Attendance } from '@/types';
import { submitAttendance } from '@/services/fieldActions';
import { formatDayLong, formatTime } from '@/utils/date';
import Screen from '@/components/layouts/Screen';
import CameraCapture from '@/components/elements/CameraCapture';
import Text from '@/components/elements/Text';
import Icon from '@/components/elements/Icon';
import Badge from '@/components/elements/Badge';
import Button from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import Card from '@/components/elements/Card';
import { PhotoThumb } from '@/components/elements/Photo';

export interface AttendanceCaptureProps {
  mode: 'masuk' | 'pulang';
}

type Result = { kind: 'sent'; attendance: Attendance | null } | { kind: 'queued' };

/** Absen masuk/pulang: selfie kamera depan, jam server, tanda lokasi dari server. */
function AttendanceCapture({ mode }: AttendanceCaptureProps) {
  const { colors } = useTheme();
  const now = useNow(15000);
  const location = useLocation();
  const { submit, submitting, error } = useFieldSubmit();
  const [result, setResult] = useState<Result | null>(null);
  const title = mode === 'masuk' ? 'Absen masuk' : 'Absen pulang';

  if (result) {
    const mark =
      result.kind === 'sent'
        ? mode === 'masuk'
          ? result.attendance?.check_in
          : result.attendance?.check_out
        : null;
    const outside = mark?.location_flag?.code === 'luar_lokasi';
    return (
      <Screen
        title={title}
        back
        footer={
          <BottomBar>
            <Button
              title="Kembali ke Beranda"
              onPress={() => router.replace('/beranda')}
              style={styles.flex}
            />
          </BottomBar>
        }>
        <Card style={styles.result}>
          <Icon
            name={result.kind === 'sent' ? 'check-circle' : 'upload-cloud'}
            size={40}
            color={result.kind === 'sent' ? colors.success : colors.warning}
          />
          <Text variant="heading" align="center">
            {result.kind === 'sent' ? `${title} tercatat` : `${title} disimpan`}
          </Text>
          {result.kind === 'sent' ? (
            <Text variant="body" color="textSecondary" align="center">
              Jam server {mark?.at ? formatTime(mark.at) : formatTime(now.toISOString())}
            </Text>
          ) : (
            <Text variant="body" color="textSecondary" align="center">
              Belum terkirim karena tidak ada sinyal. Aplikasi mengirimnya otomatis; jam absen
              memakai jam server saat terkirim.
            </Text>
          )}
          {mark?.location_flag ? (
            <Badge status={mark.location_flag} kind="attendance_location" />
          ) : null}
          {outside ? (
            <Text variant="small" color="danger" align="center">
              Anda di luar lokasi kerja{mark?.distance_m ? ` (sekitar ${mark.distance_m} m)` : ''}.
              Absen tetap diterima dan Mandor bisa memeriksanya.
            </Text>
          ) : null}
          {mark?.photo_url ? (
            <PhotoThumb uri={mark.photo_url} label="Foto absen" size={96} />
          ) : null}
        </Card>
      </Screen>
    );
  }

  const locationInfo = {
    loading: {
      icon: 'map-pin' as const,
      text: 'Membaca lokasi HP...',
      tone: 'textSecondary' as const,
    },
    ok: {
      icon: 'map-pin' as const,
      text: 'Lokasi HP terbaca. Server menentukan di lokasi atau di luar lokasi.',
      tone: 'textSecondary' as const,
    },
    denied: {
      icon: 'alert-triangle' as const,
      text: 'Izin lokasi ditolak. Absen tetap bisa dikirim, ditandai Tanpa Lokasi.',
      tone: 'warning' as const,
    },
    unavailable: {
      icon: 'alert-triangle' as const,
      text: 'Lokasi HP tidak terbaca. Absen tetap bisa dikirim, ditandai Tanpa Lokasi.',
      tone: 'warning' as const,
    },
  }[location.status];

  return (
    <Screen
      title={title}
      subtitle={formatDayLong(now.format('YYYY-MM-DD'))}
      back
      scroll={false}
      padded={false}>
      <View style={styles.flexNoPad}>
        <View
          style={[styles.clock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text variant="small" color="textSecondary">
            Jam server
          </Text>
          <Text variant="numberL">{formatTime(now.toISOString())}</Text>
        </View>
        <CameraCapture
          facing="front"
          guide="face"
          hint="Posisikan wajah di dalam bingkai, lalu ambil foto."
          confirmLabel={submitting ? 'Mengirim...' : `Kirim ${title.toLowerCase()}`}
          onConfirm={async photo => {
            if (submitting) return;
            const outcome = await submit(
              () =>
                submitAttendance(
                  mode === 'masuk' ? 'in' : 'out',
                  photo,
                  location.status === 'ok' ? location.coords : null,
                ),
              `${title} tercatat`,
            );
            if (outcome.status === 'sent')
              setResult({
                kind: 'sent',
                attendance: (outcome.data as { data?: Attendance } | null)?.data ?? null,
              });
            if (outcome.status === 'queued') setResult({ kind: 'queued' });
          }}
          footerInfo={
            <View style={styles.info}>
              <View style={styles.infoRow}>
                <Icon name={locationInfo.icon} size={18} color={colors[locationInfo.tone]} />
                <Text variant="small" color={locationInfo.tone} style={styles.flex}>
                  {locationInfo.text}
                </Text>
              </View>
              {error ? (
                <Text variant="smallStrong" color="danger" accessibilityLiveRegion="polite">
                  {error.message}
                </Text>
              ) : null}
            </View>
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexNoPad: { flex: 1 },
  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: sizes.gutter,
    marginTop: sizes.gutter,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  info: { gap: space.sm },
  infoRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  result: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
});

export default AttendanceCapture;
