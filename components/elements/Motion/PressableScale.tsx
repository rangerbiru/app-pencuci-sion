import { ReactNode, useMemo } from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { pressScale, spring } from '@/theme';

export interface PressableScaleProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'tab';
  disabled?: boolean;
  /** haptic ringan saat ditekan (bawaan ya) */
  haptic?: boolean;
  testID?: string;
}

function lightHaptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/**
 * Permukaan yang bisa ditekan dengan skala 0,97 + spring + haptic ringan.
 * Animasi tekan berjalan di UI thread (Gesture.Tap, vercel-react-native-skills
 * animation-gesture-detector-press). Pembaca layar mengaktifkan lewat accessibilityActions
 * "activate", jadi TalkBack tetap bisa menekan.
 */
function PressableScale({
  onPress,
  children,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  disabled,
  haptic = true,
  testID,
}: PressableScaleProps) {
  const reduce = useReducedMotion();
  const pressed = useSharedValue(0);

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .enabled(!disabled)
        .maxDuration(10000)
        .onBegin(() => {
          pressed.set(withSpring(1, spring.press));
        })
        .onFinalize(() => {
          pressed.set(withSpring(0, spring.press));
        })
        .onEnd((_e, success) => {
          if (!success) return;
          if (haptic) runOnJS(lightHaptic)();
          if (onPress) runOnJS(onPress)();
        }),
    [disabled, haptic, onPress, pressed],
  );

  const dim = disabled ? 0.5 : 1;
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: reduce ? 1 : interpolate(pressed.get(), [0, 1], [1, pressScale]) }],
    opacity: reduce ? interpolate(pressed.get(), [0, 1], [dim, dim * 0.85]) : dim,
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        accessible
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !!disabled }}
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={e => {
          if (e.nativeEvent.actionName === 'activate' && !disabled) onPress?.();
        }}
        testID={testID}
        style={[style, animated]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

export default PressableScale;
