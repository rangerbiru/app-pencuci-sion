import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import useTheme from '@/hooks/useTheme';
import useOnline from '@/hooks/useOnline';
import { sizes, space } from '@/theme';
import { useAppSlice, useQueueItems } from '@/slices';
import { discardItem, processQueue, retryItem } from '@/services/queue';
import { QueueItem } from '@/services/queue/types';
import { formatDateTime } from '@/utils/date';
import Screen from '@/components/layouts/Screen';
import Card from '@/components/elements/Card';
import Text from '@/components/elements/Text';
import Badge from '@/components/elements/Badge';
import Button from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import { Dialog } from '@/components/elements/Dialog';
import { EmptyState } from '@/components/elements/StateViews';

/** Daftar aksi yang belum terkirim. Terkirim otomatis saat ada sinyal. */
function Queue() {
  const { colors } = useTheme();
  const online = useOnline();
  const { user } = useAppSlice();
  const items = useQueueItems().filter(i => i.owner === (user?.id ?? null));
  const [sending, setSending] = useState(false);
  const [discard, setDiscard] = useState<QueueItem | null>(null);

  async function sendNow() {
    setSending(true);
    await processQueue();
    setSending(false);
  }

  return (
    <Screen
      title="Belum terkirim"
      back
      footer={
        items.some(i => i.status === 'pending') ? (
          <BottomBar>
            <Button
              title={online ? 'Kirim sekarang' : 'Menunggu sinyal'}
              icon="upload-cloud"
              onPress={sendNow}
              isLoading={sending}
              disabled={!online}
              style={styles.flex}
            />
          </BottomBar>
        ) : undefined
      }>
      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon="check-circle"
            title="Semua sudah terkirim"
            message="Tidak ada absen atau setoran yang tertunda."
            actionLabel="Kembali ke Beranda"
            onAction={() => router.replace('/beranda')}
          />
        </Card>
      ) : (
        <Card style={styles.tight}>
          {items.map((i, idx) => (
            <View
              key={i.id}
              style={[
                styles.row,
                idx < items.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}>
              <Text variant="bodyStrong">{i.label}</Text>
              <Text variant="small" color="textSecondary">
                Disimpan {formatDateTime(i.createdAt)}
                {i.attempts ? `, dicoba ${i.attempts} kali` : ''}
              </Text>
              <Badge
                label={
                  i.status === 'failed'
                    ? 'Gagal dikirim'
                    : i.status === 'sending'
                      ? 'Sedang dikirim'
                      : 'Belum terkirim'
                }
                tone={i.status === 'failed' ? 'error' : 'gold'}
                icon={i.status === 'failed' ? 'alert-circle' : 'upload-cloud'}
              />
              {i.lastError && i.status === 'failed' ? (
                <Text variant="small" color="danger">
                  {i.lastError}
                </Text>
              ) : null}
              {i.status === 'failed' ? (
                <View style={styles.actions}>
                  <Button
                    title="Hapus"
                    variant="danger"
                    onPress={() => setDiscard(i)}
                    style={styles.flex}
                  />
                  <Button
                    title="Coba lagi"
                    variant="secondary"
                    onPress={() => retryItem(i.id)}
                    style={styles.flex}
                  />
                </View>
              ) : null}
            </View>
          ))}
        </Card>
      )}
      <Text variant="small" color="textSecondary" align="center" style={styles.pad}>
        Aksi yang belum terkirim tersimpan di HP ini dan dikirim sekali saja, walau dicoba
        berkali-kali.
      </Text>
      <Dialog
        visible={!!discard}
        title="Hapus aksi ini?"
        message={
          discard
            ? `${discard.label} tidak akan dikirim. Ulangi dari Beranda bila masih perlu.`
            : undefined
        }
        confirmLabel="Hapus"
        confirmVariant="danger"
        onConfirm={async () => {
          if (discard) await discardItem(discard.id);
          setDiscard(null);
        }}
        onCancel={() => setDiscard(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tight: { paddingVertical: space.xs },
  row: { paddingVertical: space.md, gap: space.xs },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  pad: { paddingHorizontal: sizes.gutter },
});

export default Queue;
