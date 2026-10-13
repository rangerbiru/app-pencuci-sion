import { ActivityIndicator, StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import type { LocationState } from '@/hooks/useLocation';
import { space } from '@/theme';
import type { LocationVerdict } from '@/utils/geo';
import { formatPcs } from '@/utils/format';
import Text from '@/components/elements/Text';
import Icon, { IconName } from '@/components/elements/Icon';
import Button from '@/components/elements/Button';

export interface LocationStatusProps {
  state: LocationState;
  /** perkiraan bila server mengirim koordinat lokasi kerja dan radius */
  verdict?: LocationVerdict | null;
  onRequest: () => void;
  onRetry: () => void;
  onOpenSettings: () => void;
  onEnableGps: () => void;
}

type Tone = 'textSecondary' | 'warning' | 'success';

interface LocationView {
  icon: IconName | null;
  tone: Tone;
  text: string;
  action?: { label: string; icon: IconName; onPress: () => void };
}

const NO_LOCATION = 'Absen tetap bisa dikirim, ditandai Tanpa lokasi.';
const meters = (n: number) => `${formatPcs(n)} m`;

/** Alasan yang jelas per keadaan + satu tombol untuk memperbaikinya. */
export function describeLocation(
  state: LocationState,
  verdict: LocationVerdict | null | undefined,
  actions: Pick<LocationStatusProps, 'onRequest' | 'onRetry' | 'onOpenSettings' | 'onEnableGps'>,
): LocationView {
  switch (state.status) {
    case 'web':
      return {
        icon: 'monitor',
        tone: 'textSecondary',
        text: `Lokasi tidak tersedia di pratinjau web. ${NO_LOCATION}`,
      };
    case 'checking':
    case 'loading':
      return {
        icon: null,
        tone: 'textSecondary',
        text: 'Membaca lokasi HP (paling lama 10 detik)...',
      };
    case 'ask':
      return {
        icon: 'map-pin',
        tone: 'textSecondary',
        text: 'Lokasi dipakai untuk menandai absen di lokasi kerja atau di luar lokasi. Setelah tombol ini HP meminta izin.',
        action: { label: 'Izinkan lokasi', icon: 'map-pin', onPress: actions.onRequest },
      };
    case 'denied':
      return {
        icon: 'alert-triangle',
        tone: 'warning',
        text: state.canAskAgain
          ? `Izin lokasi ditolak. ${NO_LOCATION}`
          : `Izin lokasi ditolak. Buka Pengaturan HP, pilih SION, lalu izinkan Lokasi. ${NO_LOCATION}`,
        action: state.canAskAgain
          ? { label: 'Izinkan lokasi', icon: 'map-pin', onPress: actions.onRequest }
          : { label: 'Buka Pengaturan', icon: 'settings', onPress: actions.onOpenSettings },
      };
    case 'gps_off':
      return {
        icon: 'alert-triangle',
        tone: 'warning',
        text: `Lokasi (GPS) HP mati. Nyalakan supaya absen tercatat di lokasi. ${NO_LOCATION}`,
        action: { label: 'Nyalakan lokasi', icon: 'navigation', onPress: actions.onEnableGps },
      };
    case 'weak':
      return {
        icon: 'alert-triangle',
        tone: 'warning',
        text: `Sinyal GPS lemah, lokasi belum terbaca dalam 10 detik. Coba dekat jendela atau di luar ruangan. ${NO_LOCATION}`,
        action: { label: 'Coba lagi', icon: 'refresh-cw', onPress: actions.onRetry },
      };
    case 'ok':
      if (verdict)
        return verdict.inside
          ? {
              icon: 'check-circle',
              tone: 'success',
              text: `Di lokasi kerja (± ${meters(verdict.distance)}).`,
            }
          : {
              icon: 'alert-triangle',
              tone: 'warning',
              text: `Di luar lokasi (± ${meters(verdict.distance)}). Absen tetap diterima dan Mandor bisa memeriksanya.`,
            };
      return {
        icon: 'map-pin',
        tone: 'textSecondary',
        text: `Lokasi HP terbaca${state.accuracy ? ` (akurasi ± ${meters(Math.round(state.accuracy))})` : ''}. Server menentukan di lokasi atau di luar lokasi.`,
      };
  }
}

/** Baris status lokasi di layar absen. */
function LocationStatus({ state, verdict, ...actions }: LocationStatusProps) {
  const { colors } = useTheme();
  const v = describeLocation(state, verdict, actions);
  return (
    <View style={styles.root} accessibilityLiveRegion="polite">
      <View style={styles.row}>
        {v.icon ? (
          <Icon name={v.icon} size={18} color={colors[v.tone]} />
        ) : (
          <ActivityIndicator size="small" color={colors.textSecondary} />
        )}
        <Text variant="small" color={v.tone} style={styles.flex}>
          {v.text}
        </Text>
      </View>
      {v.action ? (
        <Button
          title={v.action.label}
          icon={v.action.icon}
          variant="secondary"
          onPress={v.action.onPress}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  flex: { flex: 1 },
  action: { marginLeft: 26 },
});

export default LocationStatus;
