import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '@/hooks/useTheme';
import { sizes, space } from '@/theme';
import Text from '@/components/elements/Text';
import Icon from '@/components/elements/Icon';
import Emblem from '@/components/elements/Emblem';
import PendingChip from '../PendingChip';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  /** layar tumpuk: tombol kembali; layar tab: emblem */
  back?: boolean;
  right?: ReactNode;
}

/** Header navy polos (tanpa gradient), seperti sidebar web. */
function AppHeader({ title, subtitle, back, right }: AppHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.root, { backgroundColor: colors.header, paddingTop: insets.top + space.sm }]}>
      {back ? (
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          style={styles.back}>
          <Icon name="arrow-left" size={24} color={colors.onHeader} />
        </Pressable>
      ) : (
        <Emblem size={sizes.headerEmblem + 8} />
      )}
      <View style={styles.titles}>
        <Text
          variant={back ? 'subheading' : 'heading'}
          style={{ color: colors.onHeader }}
          numberOfLines={2}
          accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" style={{ color: colors.onHeaderMuted }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      <PendingChip />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: sizes.gutter,
    paddingBottom: space.md,
  },
  back: {
    width: sizes.touch,
    height: sizes.touch,
    marginLeft: -space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: { flex: 1, gap: 2 },
});

export default AppHeader;
