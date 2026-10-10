import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { space } from '@/theme';
import { useQueueItems, useAppSlice } from '@/slices';
import { useGetAttendanceTodayQuery } from '@/services';
import { formatTime } from '@/utils/date';
import Card from '@/components/elements/Card';
import Section from '@/components/elements/Section';
import Text from '@/components/elements/Text';
import Button from '@/components/elements/Button';

/** Absen sendiri untuk Mandor dan Kepala Pencuci (tanpa langkah kerja pencuci). */
function AttendanceCard() {
  const { user } = useAppSlice();
  const attendance = useGetAttendanceTodayQuery();
  const queue = useQueueItems().filter(q => q.owner === (user?.id ?? null));
  const queuedIn = queue.some(q => q.kind === 'check_in');
  const queuedOut = queue.some(q => q.kind === 'check_out');
  const checkedIn = !!attendance.data?.check_in.at;
  const checkedOut = !!attendance.data?.check_out.at;

  const message = checkedOut
    ? `Masuk jam ${formatTime(attendance.data?.check_in.at)}, pulang jam ${formatTime(attendance.data?.check_out.at)}.`
    : checkedIn
      ? `Masuk jam ${formatTime(attendance.data?.check_in.at)}.${queuedOut ? ' Absen pulang menunggu sinyal.' : ''}`
      : queuedIn
        ? 'Absen masuk menunggu sinyal. Dikirim otomatis.'
        : 'Belum absen masuk hari ini.';

  return (
    <Section title="Absen saya">
      <Card style={styles.card}>
        <Text variant="body" color="textSecondary">
          {message}
        </Text>
        {!checkedOut && !(checkedIn ? queuedOut : queuedIn) ? (
          <Button
            title={checkedIn ? 'Absen pulang' : 'Absen masuk'}
            variant={checkedIn ? 'secondary' : 'primary'}
            icon={checkedIn ? 'log-out' : 'log-in'}
            onPress={() => router.push(checkedIn ? '/absen?mode=pulang' : '/absen?mode=masuk')}
          />
        ) : null}
      </Card>
    </Section>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.md },
});

export default AttendanceCard;
