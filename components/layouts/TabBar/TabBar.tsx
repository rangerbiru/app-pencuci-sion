import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '@/hooks/useTheme';
import { fonts, space } from '@/theme';
import { tabLabelLayout } from '@/utils/navigation';
import Text from '@/components/elements/Text';
import Icon, { IconName } from '@/components/elements/Icon';

export interface TabItem {
  name: string;
  title: string;
  icon: IconName;
}

export interface TabBarProps extends BottomTabBarProps {
  /** tab yang tampil untuk peran ini, berurutan */
  items: TabItem[];
}

const PILL_WIDTH = 56;
const PILL_HEIGHT = 32;

/**
 * Bilah tab bawah dengan pil di belakang ikon tab aktif. Efek tekan hanya di dalam pil,
 * sedangkan area sentuhnya tetap selebar tab. Label tidak pernah terpotong: ukurannya
 * mengikuti besar huruf HP lalu dikecilkan atau dipecah dua baris bila tidak muat.
 */
function TabBar({ state, navigation, items }: TabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const label = tabLabelLayout(
    items.map(i => i.title),
    width,
    fontScale,
  );
  const lineHeight = Math.round(label.fontSize * 1.25);
  const activeName = state.routes[state.index]?.name;

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.root,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + space.xs,
        },
      ]}>
      {items.map(item => {
        const route = state.routes.find(r => r.name === item.name);
        if (!route) return null;
        const focused = activeName === item.name;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable
            key={item.name}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={item.title}
            style={styles.item}>
            {({ pressed }) => (
              <>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: focused
                        ? colors.navIndicator
                        : pressed
                          ? colors.pressed
                          : 'transparent',
                      opacity: focused && pressed ? 0.75 : 1,
                    },
                  ]}>
                  <Icon
                    name={item.icon}
                    size={22}
                    color={focused ? colors.onNavIndicator : colors.textSecondary}
                  />
                </View>
                <Text
                  allowFontScaling={false}
                  numberOfLines={label.lines}
                  align="center"
                  style={{
                    fontFamily: fonts.semiBold,
                    fontSize: label.fontSize,
                    lineHeight,
                    minHeight: lineHeight * label.lines,
                    color: focused ? colors.text : colors.textSecondary,
                  }}>
                  {item.title}
                </Text>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: space.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: 1,
    minHeight: 56,
  },
  pill: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TabBar;
