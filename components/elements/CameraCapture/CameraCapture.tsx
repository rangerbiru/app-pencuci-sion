import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import useTheme from '@/hooks/useTheme';
import { palette, radius, sizes, space } from '@/theme';
import { compressPhoto, Photo } from '@/utils/photo';
import Text from '../Text';
import Button from '../Button';
import Image from '../Image';
import BottomBar from '../BottomBar';
import { EmptyState } from '../StateViews';

export interface CameraCaptureProps {
  facing: 'front' | 'back';
  /** bingkai panduan: oval wajah (absen) atau persegi layar timbangan */
  guide: 'face' | 'scale' | 'document';
  hint: string;
  /** teks tombol setelah foto diambil, mis. "Pakai foto" */
  confirmLabel?: string;
  onConfirm: (photo: Photo) => void;
  /** isi tambahan di bawah pratinjau (jam server, tanda lokasi) */
  footerInfo?: React.ReactNode;
}

/**
 * Kamera dengan bingkai panduan, pratinjau, dan ambil ulang. Foto langsung dikompres
 * (1280 px, JPEG 0,7) sebelum diserahkan ke layar.
 */
function CameraCapture({
  facing,
  guide,
  hint,
  confirmLabel = 'Pakai foto',
  onConfirm,
  footerInfo,
}: CameraCaptureProps) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <EmptyState
        icon="camera-off"
        title="Izinkan kamera"
        message={
          permission.canAskAgain
            ? 'Kamera dipakai untuk mengambil foto bukti. Foto hanya dikirim ke server SION.'
            : 'Izin kamera ditolak. Buka Pengaturan HP, pilih SION, lalu izinkan Kamera.'
        }
        actionLabel={permission.canAskAgain ? 'Izinkan kamera' : 'Buka Pengaturan'}
        onAction={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
      />
    );
  }

  async function take() {
    if (!camera.current) return;
    setBusy(true);
    setError(null);
    try {
      const shot = await camera.current.takePictureAsync({ quality: 0.8, skipProcessing: false });
      if (!shot) throw new Error('no photo');
      const compressed = await compressPhoto({
        uri: shot.uri,
        width: shot.width,
        height: shot.height,
        takenAt: new Date().toISOString(),
      });
      setPhoto(compressed);
    } catch {
      setError('Foto gagal diambil. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <View style={[styles.frame, { backgroundColor: palette.gray['950'] }]}>
          {photo ? (
            <Image
              source={{ uri: photo.uri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityLabel="Pratinjau foto"
            />
          ) : (
            <CameraView
              ref={camera}
              style={StyleSheet.absoluteFill}
              facing={facing}
              mirror={facing === 'front'}
            />
          )}
          {!photo ? (
            <View pointerEvents="none" style={styles.guideWrap}>
              <View
                style={[
                  guide === 'face'
                    ? styles.guideFace
                    : guide === 'scale'
                      ? styles.guideScale
                      : styles.guideDoc,
                  { borderColor: colors.accent },
                ]}
              />
            </View>
          ) : null}
        </View>
        <Text variant="body" color="textSecondary" align="center">
          {photo ? 'Periksa foto. Pastikan jelas dan tidak buram.' : hint}
        </Text>
        {error ? (
          <Text
            variant="smallStrong"
            color="danger"
            align="center"
            accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        {footerInfo}
      </View>
      <BottomBar>
        {photo ? (
          <>
            <Button
              title="Ambil ulang"
              variant="secondary"
              size="large"
              icon="rotate-ccw"
              onPress={() => setPhoto(null)}
              style={styles.flex}
            />
            <Button title={confirmLabel} onPress={() => onConfirm(photo)} style={styles.flex} />
          </>
        ) : (
          <Button
            title="Ambil foto"
            icon="camera"
            onPress={take}
            isLoading={busy}
            style={styles.flex}
          />
        )}
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, padding: sizes.gutter, gap: space.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  // bingkai mengisi sisa tinggi (tidak memakai rasio tetap) supaya petunjuk dan info lokasi
  // di bawahnya tidak terdorong ke balik tombol bawah di layar 360 dp
  frame: {
    flex: 1,
    minHeight: 220,
    maxHeight: 520,
    width: '100%',
    alignSelf: 'center',
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  guideWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  guideFace: {
    width: '62%',
    aspectRatio: 0.78,
    borderRadius: 999,
    borderWidth: 3,
    borderStyle: 'dashed',
  },
  guideScale: { width: '78%', aspectRatio: 1.6, borderRadius: radius.table, borderWidth: 3 },
  guideDoc: { width: '86%', aspectRatio: 0.75, borderRadius: radius.table, borderWidth: 3 },
});

export default CameraCapture;
