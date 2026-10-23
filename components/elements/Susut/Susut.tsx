import { StyleSheet, View } from 'react-native';
import { space } from '@/theme';
import { SusutInput, susutParts } from '@/utils/susut';
import Text from '../Text';

export interface SusutProps extends SusutInput {
  /** teks "Susut" tidak ditampilkan bila kedua angka kosong */
  hideWhenEmpty?: boolean;
}

/**
 * Satu-satunya tempat susut ditampilkan: Hancur X gr (Y%) · Hilang −X gr (−Y%).
 * Data lama yang hanya punya satu angka susut (`legacyGram`) tampil sebagai Hilang.
 */
function Susut({ hideWhenEmpty = true, ...input }: SusutProps) {
  const { crushed, lost } = susutParts(input);
  if (!crushed && !lost && hideWhenEmpty) return null;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={[crushed, lost].filter(Boolean).join(', ')}>
      {crushed ? (
        <Text variant="smallStrong" color="textSecondary">
          {crushed}
        </Text>
      ) : null}
      {crushed && lost ? (
        <Text variant="small" color="textSecondary">
          {'·'}
        </Text>
      ) : null}
      {lost ? (
        <Text variant="smallStrong" color="danger">
          {lost}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: space.sm },
});

export default Susut;
