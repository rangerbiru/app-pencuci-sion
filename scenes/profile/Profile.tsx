import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useDispatch } from 'react-redux';
import useTheme from '@/hooks/useTheme';
import useSetThemePreference from '@/hooks/useSetThemePreference';
import { sizes, space } from '@/theme';
import { ThemePreference, useAppSlice, useQueueItems } from '@/slices';
import { useGetBalanceQuery, useGetMeQuery } from '@/services';
import { signOut } from '@/services/session';
import config, { isFeatureEnabled } from '@/utils/config';
import { formatDate } from '@/utils/date';
import type { Dispatch } from '@/utils/store';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Button from '@/components/elements/Button';
import ListRow from '@/components/elements/ListRow';
import Emblem from '@/components/elements/Emblem';
import Amount from '@/components/elements/Amount';
import Segmented from '@/components/elements/Segmented';
import { Dialog } from '@/components/elements/Dialog';

const COMPONENT_LABEL: Record<string, string> = {
  upah_bahan: 'Upah bahan',
  upah_hasil: 'Upah hasil',
  upah_qc: 'Upah QC',
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.field}>
      <Text variant="small" color="textSecondary">
        {label}
      </Text>
      <Text variant="body">{value || '-'}</Text>
    </View>
  );
}

/** Ringkasan saldo dan pintu ke Pendapatan, untuk tab Akun Mandor. */
function EarningsSummary() {
  const balance = useGetBalanceQuery();
  const b = balance.data;
  return (
    <Section title="Pendapatan">
      <Card padded={false} style={styles.links}>
        <View style={styles.balance}>
          <Text variant="small" color="textSecondary">
            Saldo dapat dicairkan
          </Text>
          <Amount value={b?.dapat_dicairkan ?? null} unit="rupiah" whole size="l" />
        </View>
        <ListRow
          title="Pendapatan dan bonus"
          subtitle="Rincian per minggu, bonus berjalan, dan saldo"
          onPress={() => router.push('/pendapatan-saya')}
        />
        {isFeatureEnabled('withdrawals') ? (
          <ListRow title="Tarik dana" onPress={() => router.push('/tarik-dana')} divider={false} />
        ) : null}
      </Card>
    </Section>
  );
}

/**
 * Profil: data diri, kontrak berlaku, ganti password, belum terkirim, keluar, versi.
 * `account` = tab Akun Mandor: Pendapatan ditampilkan di atas.
 */
function Profile({ account = false }: { account?: boolean }) {
  const { colors, preference } = useTheme();
  const setTheme = useSetThemePreference();
  const dispatch = useDispatch<Dispatch>();
  const { user: cached } = useAppSlice();
  const me = useGetMeQuery();
  const user = me.data ?? cached;
  const queue = useQueueItems().filter(q => q.owner === (user?.id ?? null));
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await signOut(dispatch, { userId: user?.id ?? null });
  }

  return (
    <Screen
      title={account ? 'Akun' : 'Profil'}
      refreshing={me.isFetching && !me.isLoading}
      onRefresh={me.refetch}>
      <Card style={styles.head}>
        <Emblem size={56} />
        <View style={styles.flex}>
          <Text variant="heading">{user?.name}</Text>
          {user ? <Badge status={user.role} kind="role" icon="user" /> : null}
        </View>
      </Card>

      {account && isFeatureEnabled('earnings') ? <EarningsSummary /> : null}

      <Section title="Data diri">
        <Card style={styles.fields}>
          <Field label="Email" value={user?.email} />
          <Field label="Nomor HP" value={user?.phone} />
          <Field label="Lokasi kerja" value={user?.location?.name} />
          {user?.kepala_pencuci ? (
            <Field label="Kepala Pencuci" value={user.kepala_pencuci.name} />
          ) : null}
          {user?.mandor ? <Field label="Mandor" value={user.mandor.name} /> : null}
        </Card>
      </Section>

      <Section title="Kontrak berlaku">
        <Card style={styles.fields}>
          {user?.contract ? (
            <>
              <Field label="Berlaku sejak" value={formatDate(user.contract.effective_date)} />
              <Field label="Lokasi" value={user.contract.location} />
              {user.contract.skema ? (
                <Field label="Skema" value={user.contract.skema.label} />
              ) : null}
              <View style={styles.field}>
                <Text variant="small" color="textSecondary">
                  Komponen upah
                </Text>
                <View style={styles.badges}>
                  {Object.entries(user.contract.components).map(([k, on]) => (
                    <Badge
                      key={k}
                      label={COMPONENT_LABEL[k] ?? k}
                      tone={on ? 'accent' : 'neutral'}
                      icon={on ? 'check' : 'minus'}
                    />
                  ))}
                </View>
              </View>
            </>
          ) : (
            <Text variant="body" color="textSecondary">
              Belum ada kontrak berlaku. Hubungi Admin; upah tidak bisa dihitung tanpa kontrak.
            </Text>
          )}
        </Card>
      </Section>

      <Section title="Tampilan" description="Terang cocok untuk ruang cuci yang terang.">
        <Segmented<ThemePreference>
          accessibilityLabel="Tampilan"
          value={preference}
          onChange={setTheme}
          options={[
            { value: 'light', label: 'Terang' },
            { value: 'dark', label: 'Gelap' },
            { value: 'system', label: 'Ikuti sistem' },
          ]}
        />
      </Section>

      <Card padded={false} style={styles.links}>
        <ListRow
          title="Ganti password"
          onPress={() => router.push('/ganti-password')}
          left={null}
        />
        <ListRow
          title="Belum terkirim"
          subtitle={queue.length ? `${queue.length} aksi menunggu sinyal` : 'Semua sudah terkirim'}
          onPress={() => router.push('/antrean')}
          divider={false}
        />
      </Card>

      <Button
        title="Keluar"
        variant="danger"
        icon="log-out"
        onPress={() => setConfirmLogout(true)}
      />
      <Text variant="small" color="textSecondary" align="center">
        SION versi {config.appVersion}
      </Text>

      <Dialog
        visible={confirmLogout}
        title="Keluar dari aplikasi?"
        message={
          queue.length
            ? `Masih ada ${queue.length} aksi yang belum terkirim. Bila keluar sekarang, aksi itu dihapus dan harus diulang. Sebaiknya tunggu sampai ada sinyal.`
            : 'Anda perlu memasukkan email/nomor HP dan password lagi.'
        }
        confirmLabel={queue.length ? 'Tetap keluar' : 'Keluar'}
        confirmVariant="danger"
        onConfirm={logout}
        onCancel={() => setConfirmLogout(false)}
        isLoading={loggingOut}
      />
      <View style={{ height: space.sm, backgroundColor: colors.background }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  flex: { flex: 1, gap: space.xs },
  fields: { gap: space.md },
  field: { gap: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xs },
  links: { paddingHorizontal: sizes.gutter },
  balance: { paddingTop: space.lg, paddingBottom: space.sm, gap: space.xxs },
});

export default Profile;
