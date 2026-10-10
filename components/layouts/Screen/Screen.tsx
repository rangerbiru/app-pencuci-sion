import { ReactNode, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { sizes, space } from '@/theme';
import AppHeader, { AppHeaderProps } from '../AppHeader';
import OfflineBanner from '../OfflineBanner';

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
  const bottomSpace = footer
    ? footerHeight + space.xxl
    : fab
      ? fabHeight + space.lg * 2
      : space.xxxl;
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {header ?? (
        <>
          <AppHeader title={title} {...headerProps} />
          <OfflineBanner />
        </>
      )}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomSpace },
            gap !== undefined && { gap },
          ]}
          scrollIndicatorInsets={footer ? { bottom: footerHeight } : undefined}
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
          {fab}
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
