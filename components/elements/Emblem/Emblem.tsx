import { StyleSheet, View } from 'react-native';
import { images, palette } from '@/theme';
import Image from '../Image';

/**
 * Emblem SION di lingkaran krem bergaris emas (aturan logo: emblem saja untuk ukuran kecil;
 * di atas navy diletakkan dalam lingkaran terang).
 */
function Emblem({ size = 40 }: { size?: number }) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Logo SION"
      style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image source={images.emblem} style={{ width: size * 0.78, height: size * 0.78 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    backgroundColor: palette.base.bg,
    borderWidth: 1.5,
    borderColor: `${palette.gold['500']}99`,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Emblem;
