import { StyleSheet, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '@/hooks/useTheme';
import { useAppSlice } from '@/slices';
import { fonts } from '@/theme';
import config from '@/utils/config';
import { ALL_TABS, TabName, tabsForRole } from '@/utils/navigation';
import Icon, { IconName } from '@/components/elements/Icon';

const TAB_META: Record<TabName, { title: string; icon: IconName }> = {
  beranda: { title: 'Beranda', icon: 'home' },
  tim: { title: 'Tim', icon: 'users' },
  batch: { title: 'Batch', icon: 'package' },
  verifikasi: { title: 'Verifikasi', icon: 'check-square' },
  kartu: { title: 'Kartu', icon: 'clipboard' },
  pendapatan: { title: 'Pendapatan', icon: 'credit-card' },
  riwayat: { title: 'Riwayat', icon: 'calendar' },
  profil: { title: 'Profil', icon: 'user' },
};

/** Tab menyesuaikan peran dari /me. */
export default function TabsLayout() {
  const { user } = useAppSlice();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const visible = tabsForRole(user?.role.code, config.features);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
        tabBarItemStyle: { paddingHorizontal: 0 },
        tabBarAllowFontScaling: false,
      }}>
      {ALL_TABS.map(name => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: TAB_META[name].title,
            href: visible.includes(name) ? undefined : null,
            tabBarAccessibilityLabel: TAB_META[name].title,
            tabBarLabel: ({ color, focused }) => (
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                allowFontScaling={false}
                style={[
                  styles.label,
                  {
                    color,
                    fontFamily: focused ? fonts.bold : fonts.medium,
                    fontSize: visible.length >= 6 ? 10 : 11.5,
                  },
                ]}>
                {TAB_META[name].title}
              </Text>
            ),
            tabBarIcon: ({ color, focused }) => (
              <Icon
                name={TAB_META[name].icon}
                size={focused ? 24 : 22}
                color={focused ? colors.accentPressed : color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: { lineHeight: 14, textAlign: 'center' },
});
