import { Tabs } from 'expo-router';
import { useAppSlice } from '@/slices';
import config from '@/utils/config';
import { ALL_TABS, TabName, tabsForRole } from '@/utils/navigation';
import { IconName } from '@/components/elements/Icon';
import TabBar from '@/components/layouts/TabBar';

const TAB_META: Record<TabName, { title: string; icon: IconName }> = {
  beranda: { title: 'Beranda', icon: 'home' },
  tim: { title: 'Tim', icon: 'users' },
  batch: { title: 'Batch', icon: 'package' },
  verifikasi: { title: 'Verifikasi', icon: 'check-square' },
  kartu: { title: 'Kartu Kerja', icon: 'clipboard' },
  pendapatan: { title: 'Pendapatan', icon: 'credit-card' },
  riwayat: { title: 'Riwayat', icon: 'calendar' },
  profil: { title: 'Profil', icon: 'user' },
  akun: { title: 'Akun', icon: 'user' },
};

/** Tab menyesuaikan peran dari /me (maksimal 5, tanpa drawer). */
export default function TabsLayout() {
  const { user } = useAppSlice();
  const visible = tabsForRole(user?.role.code, config.features);
  const items = visible.map(name => ({ name, ...TAB_META[name] }));

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={props => <TabBar {...props} items={items} />}>
      {ALL_TABS.map(name => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: TAB_META[name].title,
            href: visible.includes(name) ? undefined : null,
          }}
        />
      ))}
    </Tabs>
  );
}
