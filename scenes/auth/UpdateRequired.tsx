import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import { sizes, space } from '@/theme';
import config from '@/utils/config';
import { checkMeta } from '@/services/session';
import { useAppSlice } from '@/slices';
import Text from '@/components/elements/Text';
import Button from '@/components/elements/Button';
import Emblem from '@/components/elements/Emblem';
import BottomBar from '@/components/elements/BottomBar';
import type { Dispatch } from '@/utils/store';

/** Ditampilkan bila versi aplikasi di bawah min_app_version dari /meta. */
function UpdateRequired() {
  const { colors } = useTheme();
  const dispatch = useDispatch<Dispatch>();
  const { minAppVersion, updateRequired } = useAppSlice();
  const [checking, setChecking] = useState(false);

  async function recheck() {
    setChecking(true);
    await checkMeta(dispatch);
    setChecking(false);
    router.replace('/');
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.body}>
        <Emblem size={96} />
        <Text variant="title" align="center" accessibilityRole="header">
          Perbarui aplikasi
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          Versi aplikasi Anda {config.appVersion}. Versi paling rendah yang bisa dipakai{' '}
          {minAppVersion ?? '-'}. Minta file APK terbaru ke Mandor atau Admin, pasang, lalu buka
          lagi.
        </Text>
        {!updateRequired ? (
          <Text variant="smallStrong" color="success" align="center">
            Versi sudah sesuai.
          </Text>
        ) : null}
      </View>
      <BottomBar>
        <Button
          title="Periksa lagi"
          icon="refresh-cw"
          onPress={recheck}
          isLoading={checking}
          style={styles.flex}
        />
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    padding: sizes.gutter,
  },
});

export default UpdateRequired;
