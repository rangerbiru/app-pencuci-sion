import { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { sizes, space } from '@/theme';
import AppHeader, { AppHeaderProps } from '../AppHeader';
import OfflineBanner from '../OfflineBanner';

export interface ScreenProps extends AppHeaderProps {
  children: ReactNode;
  /** bilah aksi bawah (BottomBar) */
  footer?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
  /** isi tanpa padding tepi (kamera layar penuh) */
  padded?: boolean;
}

/** Kerangka layar: header navy, banner sinyal, isi bergulir dengan tarik-untuk-menyegarkan. */
function Screen({
  children,
  footer,
  refreshing = false,
  onRefresh,
  scroll = true,
  padded = true,
  ...header
}: ScreenProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader {...header} />
      <OfflineBanner />
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.textSecondary}
                title="Tarik untuk menyegarkan"
              />
            ) : undefined
          }>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padded && styles.contentStatic]}>{children}</View>
      )}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: sizes.gutter, gap: space.xxl, paddingBottom: space.xxxl },
  contentStatic: { padding: sizes.gutter },
});

export default Screen;
