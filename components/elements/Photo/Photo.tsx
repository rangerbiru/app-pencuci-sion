import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '@/hooks/useTheme';
import { palette, radius, sizes, space } from '@/theme';
import Image from '../Image';
import Icon from '../Icon';
import Text from '../Text';

export interface PhotoThumbProps {
  uri: string | null | undefined;
  label: string;
  size?: number;
  /** lebar penuh (rasio 4:3) alih-alih kotak */
  wide?: boolean;
}

/** Foto kecil; ketuk untuk melihat layar penuh. */
export function PhotoThumb({ uri, label, size = 72, wide }: PhotoThumbProps) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  if (!uri) {
    return (
      <View
        style={[
          styles.empty,
          wide ? styles.wide : { width: size, height: size },
          { backgroundColor: colors.surfaceSunken, borderColor: colors.border },
        ]}
        accessible
        accessibilityLabel={`${label}: tidak ada foto`}>
        <Icon name="image" size={20} color={colors.textSecondary} />
      </View>
    );
  }
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel={`${label}. Ketuk untuk memperbesar`}>
        <Image
          source={{ uri }}
          style={[
            wide
              ? [styles.wide, { backgroundColor: colors.surfaceSunken }]
              : { width: size, height: size },
            styles.thumb,
          ]}
          contentFit={wide ? 'contain' : 'cover'}
        />
      </Pressable>
      <Modal
        visible={open}
        onRequestClose={() => setOpen(false)}
        animationType="fade"
        statusBarTranslucent>
        <View style={styles.viewer}>
          <Image
            source={{ uri }}
            style={styles.full}
            contentFit="contain"
            accessibilityLabel={label}
          />
          <View style={[styles.viewerBar, { paddingTop: insets.top + space.sm }]}>
            <Text variant="bodyStrong" style={styles.viewerTitle} numberOfLines={1}>
              {label}
            </Text>
            <Pressable
              onPress={() => setOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Tutup foto"
              style={styles.close}>
              <Icon name="x" size={28} color={palette.white} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumb: { borderRadius: radius.button },
  wide: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.table },
  empty: {
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewer: { flex: 1, backgroundColor: palette.gray['950'] },
  full: { flex: 1 },
  viewerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.gutter,
    paddingBottom: space.sm,
    backgroundColor: 'rgba(12,17,29,0.6)',
  },
  viewerTitle: { flex: 1, color: palette.white },
  close: {
    width: sizes.touch,
    height: sizes.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
