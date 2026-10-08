import { useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import useTheme from '@/hooks/useTheme';
import { palette, radius, space } from '@/theme';
import Text from '../Text';
import TextField from '../TextField';
import Button from '../Button';
import { EmptyState } from '../StateViews';

export interface QrScannerProps {
  onCode: (raw: string) => void;
  manualLabel?: string;
  busy?: boolean;
}

/** Scan QR wadah dengan kamera belakang, atau ketik kodenya. */
function QrScanner({ onCode, manualLabel = 'Atau ketik kode wadah', busy }: QrScannerProps) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const locked = useRef(false);

  return (
    <View style={styles.root}>
      {permission?.granted ? (
        <View style={[styles.frame, { backgroundColor: palette.gray['950'] }]}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              if (locked.current || busy) return;
              locked.current = true;
              onCode(data);
              setTimeout(() => {
                locked.current = false;
              }, 2000);
            }}
          />
          <View pointerEvents="none" style={styles.guideWrap}>
            <View style={[styles.guide, { borderColor: colors.accent }]} />
          </View>
        </View>
      ) : permission ? (
        <EmptyState
          icon="camera-off"
          title="Izinkan kamera untuk scan QR"
          message={
            permission.canAskAgain
              ? 'Atau ketik kode wadah di bawah.'
              : 'Buka Pengaturan HP untuk mengizinkan kamera, atau ketik kode.'
          }
          actionLabel={permission.canAskAgain ? 'Izinkan kamera' : 'Buka Pengaturan'}
          onAction={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
        />
      ) : null}
      <Text variant="small" color="textSecondary" align="center">
        Arahkan kamera ke QR di wadah.
      </Text>
      <TextField
        label={manualLabel}
        value={manual}
        onChangeText={setManual}
        autoCapitalize="characters"
        placeholder="WD00001"
        returnKeyType="search"
        onSubmitEditing={() => manual.trim() && onCode(manual.trim())}
      />
      {manual.trim() ? (
        <Button
          title="Cari wadah"
          variant="secondary"
          isLoading={busy}
          onPress={() => onCode(manual.trim())}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  frame: { width: '100%', aspectRatio: 1, borderRadius: radius.card, overflow: 'hidden' },
  guideWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  guide: { width: '60%', aspectRatio: 1, borderWidth: 3, borderRadius: radius.table },
});

export default QrScanner;
