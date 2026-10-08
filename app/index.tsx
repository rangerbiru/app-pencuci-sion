import { View, Text, StyleSheet } from 'react-native';
import Image from '@/components/elements/Image';
import { images } from '@/theme';

export default function Index() {
  return (
    <View style={styles.root}>
      <Image source={images.logoFull} style={styles.logo} contentFit="contain" />
      <Text style={styles.text}>SION</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F0' },
  logo: { width: 240, height: 258 },
  text: { marginTop: 16, fontSize: 20, color: '#1E3A5F' },
});
