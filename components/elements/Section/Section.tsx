import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { sizes, space } from '@/theme';
import Text from '../Text';

export interface SectionProps {
  title: string;
  /** keterangan di bawah judul */
  description?: string;
  action?: { label: string; onPress: () => void };
  children: ReactNode;
}

/** Bagian layar dengan judul kalimat biasa (tanpa label kapital berjarak). */
function Section({ title, description, action, children }: SectionProps) {
  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <View style={styles.titles}>
          <Text variant="subheading" accessibilityRole="header">
            {title}
          </Text>
          {description ? (
            <Text variant="small" color="textSecondary">
              {description}
            </Text>
          ) : null}
        </View>
        {action ? (
          <Pressable
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            style={styles.action}>
            <Text variant="smallStrong" color="link">
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  titles: { flex: 1, gap: 2 },
  action: { minHeight: sizes.touch, justifyContent: 'center', paddingHorizontal: space.xs },
});

export default Section;
