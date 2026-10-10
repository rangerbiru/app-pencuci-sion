import { useEffect, useRef } from 'react';
import { AppState, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import useOnFocus from '@/hooks/useOnFocus';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import useTheme from '@/hooks/useTheme';
import { spring } from '@/theme';
import { useGetUnreadCountQuery } from '@/services';
import { useAppSlice } from '@/slices';
import Text from '@/components/elements/Text';
import Icon from '@/components/elements/Icon';
import { PressableScale } from '@/components/elements/Motion';

/**
 * Lonceng dengan badge belum dibaca (GET /me/notifications/unread-count). Diperbarui tiap 60 detik
 * saat terbuka, saat layar fokus, dan saat aplikasi kembali aktif. Jumlah bertambah = badge "pop"
 * dan lonceng bergoyang sekali.
 */
function Bell({ tone = 'surface' }: { tone?: 'surface' | 'onHero' }) {
  const { colors } = useTheme();
  const { status } = useAppSlice();
  const reduce = useReducedMotion();
  const q = useGetUnreadCountQuery(undefined, {
    skip: status !== 'signedIn',
    pollingInterval: 60000,
    skipPollingIfUnfocused: true,
  });
  const { refetch } = q;
  const count = q.data ?? 0;
  const prev = useRef<number | null>(null);
  const badge = useSharedValue(1);
  const swing = useSharedValue(0);

  useOnFocus(() => {
    if (status === 'signedIn') refetch();
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active' && status === 'signedIn') refetch();
    });
    return () => sub.remove();
  }, [status, refetch]);

  useEffect(() => {
    if (prev.current !== null && count > prev.current && !reduce) {
      badge.set(withSequence(withTiming(1.35, { duration: 90 }), withSpring(1, spring.pop)));
      swing.set(
        withSequence(
          withTiming(-14, { duration: 70 }),
          withTiming(12, { duration: 90 }),
          withTiming(-8, { duration: 80 }),
          withTiming(0, { duration: 70 }),
        ),
      );
    }
    prev.current = count;
  }, [count, reduce, badge, swing]);

  const bellStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${swing.get()}deg` }] }));
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badge.get() }] }));
  const label = count > 0 ? `Notifikasi, ${count} belum dibaca` : 'Notifikasi';

  return (
    <PressableScale
      onPress={() => router.push('/notifikasi')}
      accessibilityLabel={label}
      style={[
        styles.root,
        {
          backgroundColor: tone === 'onHero' ? 'rgba(255,255,255,0.12)' : colors.surface,
          borderColor: tone === 'onHero' ? 'transparent' : colors.border,
        },
      ]}>
      <Animated.View style={bellStyle}>
        <Icon name="bell" size={20} color={tone === 'onHero' ? '#FFFFFF' : colors.text} />
      </Animated.View>
      {count > 0 ? (
        <Animated.View
          style={[
            styles.badge,
            { backgroundColor: colors.danger, borderColor: colors.background },
            badgeStyle,
          ]}>
          <Text type="caption" style={styles.badgeText} maxFontSizeMultiplier={1}>
            {count > 99 ? '99+' : String(count)}
          </Text>
        </Animated.View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, lineHeight: 14 },
});

export default Bell;
