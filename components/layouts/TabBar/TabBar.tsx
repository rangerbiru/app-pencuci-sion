import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '@/hooks/useTheme';
import { duration, easing, fonts, space, spring } from '@/theme';
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

/** Ikon tab yang membesar sedikit (1,08) saat dipilih. */
function TabIcon({ name, focused, color }: { name: IconName; focused: boolean; color: string }) {
  const reduce = useReducedMotion();
  const scale = useSharedValue(focused ? 1.08 : 1);
  useEffect(() => {
    const to = focused ? 1.08 : 1;
    scale.set(reduce ? to : withTiming(to, { duration: duration.enter, easing: easing.out }));
  }, [focused, reduce, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <Animated.View style={style}>
      <Icon name={name} size={22} color={color} />
    </Animated.View>
  );
}

/**
 * Bilah tab bawah dengan pil di belakang ikon tab aktif. Pil bergeser halus antar tab (spring,
 * UI thread); efek tekan hanya di dalam pil, sedangkan area sentuhnya tetap selebar tab.
 * Label tidak pernah terpotong: ukurannya mengikuti besar huruf HP lalu dikecilkan atau dipecah
 * dua baris bila tidak muat.
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
  const activeIndex = Math.max(
    0,
    items.findIndex(i => i.name === activeName),
  );
  const reduce = useReducedMotion();
  const [barWidth, setBarWidth] = useState(width);
  const itemWidth = barWidth / Math.max(1, items.length);
  const x = useSharedValue(activeIndex * itemWidth + (itemWidth - PILL_WIDTH) / 2);
  useEffect(() => {
    const to = activeIndex * itemWidth + (itemWidth - PILL_WIDTH) / 2;
    x.set(reduce ? to : withSpring(to, spring.slide));
  }, [activeIndex, itemWidth, reduce, x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

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
      ]}
      onLayout={e => setBarWidth(e.nativeEvent.layout.width)}>
      <Animated.View
        pointerEvents="none"
        style={[styles.indicator, { backgroundColor: colors.navIndicator }, indicator]}
      />
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
                      backgroundColor: pressed
                        ? focused
                          ? 'rgba(22,41,63,0.08)'
                          : colors.pressed
                        : 'transparent',
                    },
                  ]}>
                  <TabIcon
                    name={item.icon}
                    focused={focused}
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
  indicator: {
    position: 'absolute',
    left: 0,
    top: space.sm,
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
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
