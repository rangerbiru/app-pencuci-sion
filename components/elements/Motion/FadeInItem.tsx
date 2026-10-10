import { ReactNode, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { duration, easing, stagger } from '@/theme';

/**
 * Muncul bertahap saat pertama dipasang: fade + geser naik 8 dp, jeda 35 ms per item, hanya
 * 8 item pertama (berikutnya langsung tampil). Memakai shared value + useAnimatedStyle (opacity dan
 * transform saja, UI thread), bukan layout animation, supaya tata letak tidak terganggu di web.
 * "Kurangi gerak": langsung tampil.
 */
function FadeInItem({
  index,
  children,
  style,
}: {
  index: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReducedMotion();
  const animate = !reduce && index < stagger.maxItems;
  const t = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    t.set(
      withDelay(
        index * stagger.stepMs,
        withTiming(1, { duration: duration.enter, easing: easing.out }),
      ),
    );
    // hanya sekali saat dipasang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anim = useAnimatedStyle(() => ({
    opacity: t.get(),
    transform: [{ translateY: (1 - t.get()) * stagger.offsetY }],
  }));

  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

export default FadeInItem;
