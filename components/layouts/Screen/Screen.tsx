import { Children, ReactElement, ReactNode, useState } from 'react';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
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
import type { ApiError } from '@/services/api/errors';
import Text from '@/components/elements/Text';
import Icon from '@/components/elements/Icon';
import Button from '@/components/elements/Button';

/** Ada isi yang benar-benar dirender (bukan hanya null/false dari kondisi). */
function hasChildren(children: ReactNode) {
  return Children.toArray(children).length > 0;
}

/** Penyegaran gagal: isi lama tetap tampil; ini hanya memberi tahu dan menawarkan Coba lagi. */
function RefreshErrorBanner({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.banner, { backgroundColor: colors.warningBg }]}
      accessibilityLiveRegion="polite">
      <Icon name="wifi-off" size={18} color={colors.warning} />
      <Text type="small" style={[styles.bannerText, { color: colors.warning }]}>
        Belum bisa menyegarkan. {error.message} Data di bawah dari pembaruan terakhir.
      </Text>
      {onRetry ? (
        <Button title="Coba lagi" variant="secondary" icon="refresh-cw" onPress={onRetry} />
      ) : null}
    </View>
  );
}

/** Daftar panjang/berhalaman: FlashList menjadi penggulir; `children` tampil di atas daftar. */
export interface ScreenList<T> {
  data: readonly T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  getItemType?: (item: T, index: number) => string | number;
  /** dipanggil dekat dasar daftar (muat halaman berikut) */
  onEndReached?: () => void;
  /** di bawah daftar: tombol Muat lebih banyak, catatan, atau keadaan kosong */
  footer?: ReactElement | null;
}

export interface ScreenProps<T = unknown> extends Omit<AppHeaderProps, 'title'> {
  title?: string;
  children: ReactNode;
  /** v2: header pengganti (mis. HomeHeader); banner sinyal diurus header itu */
  header?: ReactNode;
  /** v2: tombol melayang kanan bawah (aksi utama); isi diberi ruang bawah setinggi tombol */
  fab?: ReactNode;
  /** jarak antar bagian isi; bawaan 24 */
  gap?: number;
  /** gagal menyegarkan tetapi isi lama masih ada: pesan singkat + Coba lagi di atas isi */
  refreshError?: ApiError | null;
  /** bilah aksi bawah (BottomBar) */
  footer?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
  /** isi tanpa padding tepi (kamera layar penuh) */
  padded?: boolean;
  list?: ScreenList<T>;
}

/**
 * Kerangka layar: header navy, banner sinyal, isi bergulir dengan tarik-untuk-menyegarkan.
 * Bilah aksi bawah menempel di dasar layar; tingginya diukur (tombol + safe area) dan dipakai
 * sebagai ruang bawah isi, jadi baris terakhir tidak pernah tertutup tombol.
 */
function Screen<T>({
  children,
  list,
  footer,
  refreshing = false,
  onRefresh,
  scroll = true,
  padded = true,
  header,
  fab,
  gap,
  refreshError,
  title = '',
  ...headerProps
}: ScreenProps<T>) {
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
  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      // warna merek: lingkaran emas di atas permukaan kartu (Android), emas di iOS
      colors={[colors.accentPressed, colors.primary]}
      progressBackgroundColor={colors.surface}
      tintColor={colors.accent}
      title="Tarik untuk menyegarkan"
      titleColor={colors.textSecondary}
    />
  ) : undefined;
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
      {list ? (
        <FlashList
          data={list.data}
          renderItem={list.renderItem}
          keyExtractor={list.keyExtractor}
          getItemType={list.getItemType}
          onEndReached={list.onEndReached}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{
            paddingHorizontal: sizes.gutter,
            paddingTop: sizes.gutter,
            paddingBottom: bottomSpace,
          }}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          ListHeaderComponent={
            refreshError || hasChildren(children) ? (
              <View style={[styles.listHeader, gap !== undefined && { gap }]}>
                {refreshError ? (
                  <RefreshErrorBanner error={refreshError} onRetry={onRefresh} />
                ) : null}
                {children}
              </View>
            ) : null
          }
          ListFooterComponent={
            list.footer ? <View style={styles.listFooter}>{list.footer}</View> : null
          }
        />
      ) : scroll ? (
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
          refreshControl={refreshControl}>
          {refreshError ? <RefreshErrorBanner error={refreshError} onRetry={onRefresh} /> : null}
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
  banner: { borderRadius: 12, padding: space.md, gap: space.sm },
  bannerText: { flexShrink: 1 },
  contentStatic: { padding: sizes.gutter },
  // FlashList tidak mengenal `gap` di contentContainerStyle: jarak diberi di kepala dan kaki daftar
  listHeader: { gap: space.xxl, paddingBottom: space.lg },
  listFooter: { paddingTop: space.lg, gap: space.md },
});

export default Screen;
