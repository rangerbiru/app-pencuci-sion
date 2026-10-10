import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import useTheme from '@/hooks/useTheme';
import { radius, shadow, space } from '@/theme';
import Text from '../Text';
import Icon, { IconName } from '../Icon';
import PressableScale from './PressableScale';
import { useFabCollapse } from './fabCollapse';

/**
 * Tombol aksi melayang (extended FAB) di zona jempol kanan bawah: aksi utama per peran.
 * Mengecil menjadi ikon saat isi digulir ke bawah (Screen menyediakan nilainya) dan kembali
 * lengkap saat digulir ke atas atau dekat puncak. Label tetap dibaca pembaca layar.
 */
function Fab({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  const { colors } = useTheme();
  const collapsed = useFabCollapse();
  const [labelWidth, setLabelWidth] = useState(0);
  const labelStyle = useAnimatedStyle(() => {
    const c = collapsed ? collapsed.get() : 0;
    // satu elemen kecil: lebar label dianimasikan (pengecualian aturan GPU, terdokumentasi)
    return labelWidth
      ? { width: interpolate(c, [0, 1], [labelWidth, 0]), opacity: 1 - c }
      : { opacity: 1 - c };
  }, [labelWidth]);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      style={[styles.root, shadow.hero, { backgroundColor: colors.accent }]}>
      <View style={styles.row}>
        <Icon name={icon} size={22} color={colors.onAccent} />
        <Animated.View style={[styles.labelClip, labelStyle]}>
          <View
            style={styles.label}
            onLayout={e => !labelWidth && setLabelWidth(Math.ceil(e.nativeEvent.layout.width))}>
            <Text type="bodyStrong" style={{ color: colors.onAccent }} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </Animated.View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 52,
    minWidth: 52,
    borderRadius: radius.pill,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  labelClip: { overflow: 'hidden' },
  label: { paddingLeft: space.sm, paddingRight: space.xs, flexDirection: 'row' },
});

export default Fab;
