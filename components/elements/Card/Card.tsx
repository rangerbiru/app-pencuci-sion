import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { radius, shadow, space } from '@/theme';

export interface CardProps extends ViewProps {
  /** bayangan hanya untuk satu kartu terpenting per layar */
  raised?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

function Card({ raised = false, padded = true, style, ...others }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.surface, borderColor: colors.border },
        // tanpa padding = kartu berisi baris sentuh: efek tekan dipotong sudut kartu
        padded ? styles.padded : styles.clip,
        raised && shadow.xs,
        style,
      ]}
      {...others}
    />
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: radius.card, borderWidth: 1 },
  padded: { padding: space.lg },
  clip: { overflow: 'hidden' },
});

export default Card;
