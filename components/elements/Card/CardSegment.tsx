import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { radius } from '@/theme';

export interface CardSegmentProps {
  first: boolean;
  last: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Satu baris dari kartu yang dipecah per item daftar (FlashList): sudut membulat hanya di baris
 * pertama dan terakhir, garis pemisah di antara baris. Hasilnya tampak seperti satu Card.
 */
function CardSegment({ first, last, children, style }: CardSegmentProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.surface, borderColor: colors.border },
        first && styles.first,
        last ? styles.last : { borderBottomColor: colors.border },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, overflow: 'hidden' },
  first: {
    borderTopWidth: 1,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
  last: { borderBottomLeftRadius: radius.card, borderBottomRightRadius: radius.card },
});

export default CardSegment;
