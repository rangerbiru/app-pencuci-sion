import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '@/hooks/useTheme';
import { shadow, sizes, space } from '@/theme';

/** Bilah aksi di zona jempol. Isi: satu tombol utama (boleh ditemani satu tombol kedua). */
function BottomBar({ children, inTabs = false }: { children: ReactNode; inTabs?: boolean }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        shadow.xs,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: (inTabs ? 0 : insets.bottom) + space.md,
        },
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderTopWidth: 1,
    paddingTop: space.md,
    paddingHorizontal: sizes.gutter,
    flexDirection: 'row',
    gap: space.sm,
  },
});

export default BottomBar;
