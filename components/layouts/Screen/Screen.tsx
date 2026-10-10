import { ReactNode, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { FabCollapseContext } from '@/components/elements/Motion/fabCollapse';
import useTheme from '@/hooks/useTheme';
import { duration, sizes, space } from '@/theme';
import { AppHeaderProps } from '../AppHeader';
import { PageHeader } from '../HomeHeader';

export interface ScreenProps extends Omit<AppHeaderProps, 'title'> {
  title?: string;
  children: ReactNode;
  /** v2: header pengganti (mis. HomeHeader); banner sinyal diurus header itu */
  header?: ReactNode;
  /** v2: tombol melayang kanan bawah (aksi utama); isi diberi ruang bawah setinggi tombol */
  fab?: ReactNode;
  /** jarak antar bagian isi; bawaan 24 */
  gap?: number;
  /** bilah aksi bawah (BottomBar) */
  footer?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
  /** isi tanpa padding tepi (kamera layar penuh) */
  padded?: boolean;
}

/**
 * Kerangka layar: header navy, banner sinyal, isi bergulir dengan tarik-untuk-menyegarkan.
 * Bilah aksi bawah menempel di dasar layar; tingginya diukur (tombol + safe area) dan dipakai
 * sebagai ruang bawah isi, jadi baris terakhir tidak pernah tertutup tombol.
 */
function Screen({
  children,
  footer,
  refreshing = false,
  onRefresh,
  scroll = true,
  padded = true,
  header,
  fab,
  gap,
  title = '',
  ...headerProps
}: ScreenProps) {
  const { colors } = useTheme();
  const [footerHeight, setFooterHeight] = useState(0);
  const [fabHeight, setFabHeight] = useState(0);
  // tombol melayang mengecil saat menggulir ke bawah, kembali saat ke atas atau dekat puncak
  const fabCollapsed = useSharedValue(0);
  const lastY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => {
    const y = e.contentOffset.y;
    const dy = y - lastY.get();
    lastY.set(y);
    if (y < 24) {
      if (fabCollapsed.get() !== 0) fabCollapsed.set(withTiming(0, { duration: duration.enter }));
    } else if (dy > 4 && fabCollapsed.get() === 0) {
      fabCollapsed.set(withTiming(1, { duration: duration.enter }));
    } else if (dy < -4 && fabCollapsed.get() === 1) {
      fabCollapsed.set(withTiming(0, { duration: duration.enter }));
    }
  });
  const bottomSpace = footer
    ? footerHeight + space.xxl
    : fab
      ? fabHeight + space.lg * 2
      : space.xxxl;
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* v2: header terang dengan judul 18; lonceng di layar utama (tab), kembali di layar tumpuk */}
      {header ?? (
        <PageHeader
          title={title}
          subtitle={headerProps.subtitle}
          back={headerProps.back}
          bell={!headerProps.back}
          right={headerProps.right}
        />
      )}
      {scroll ? (
        <Animated.ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomSpace },
            gap !== undefined && { gap },
          ]}
          scrollIndicatorInsets={footer ? { bottom: footerHeight } : undefined}
          keyboardShouldPersistTaps="handled"
          onScroll={fab ? onScroll : undefined}
          scrollEventThrottle={16}
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
        </Animated.ScrollView>
      ) : (
        <View
          style={[
            styles.flex,
            padded && styles.contentStatic,
            footer ? { paddingBottom: footerHeight } : null,
          ]}>
          {children}
        </View>
      )}
      {fab ? (
        <View
          style={styles.fab}
          pointerEvents="box-none"
          onLayout={e => setFabHeight(Math.ceil(e.nativeEvent.layout.height))}>
          <FabCollapseContext.Provider value={fabCollapsed}>{fab}</FabCollapseContext.Provider>
        </View>
      ) : null}
      {footer ? (
        <View
          style={styles.footer}
          onLayout={e => setFooterHeight(Math.ceil(e.nativeEvent.layout.height))}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: sizes.gutter, gap: space.xxl },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  fab: { position: 'absolute', right: sizes.gutter, bottom: space.lg },
  contentStatic: { padding: sizes.gutter },
});

export default Screen;
