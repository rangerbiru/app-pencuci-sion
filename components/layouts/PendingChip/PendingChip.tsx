import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppSlice, useQueueItems } from '@/slices';
import useTheme from '@/hooks/useTheme';
import { radius, sizes, space } from '@/theme';
import Text from '@/components/elements/Text';
import Icon from '@/components/elements/Icon';

/** "Belum terkirim (n)" di header; membuka daftar antrean. Tidak tampil bila kosong. */
function PendingChip() {
  const items = useQueueItems();
  const { user } = useAppSlice();
  const { colors } = useTheme();
  const mine = items.filter(i => i.owner === (user?.id ?? null));
  if (mine.length === 0) return null;
  const failed = mine.some(i => i.status === 'failed');
  const label = `Belum terkirim ${mine.length}`;
  return (
    <Pressable
      onPress={() => router.push('/antrean')}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Buka daftar`}
      hitSlop={6}
      style={[styles.chip, { backgroundColor: failed ? colors.dangerBg : colors.warningBg }]}>
      <Icon name="upload-cloud" size={16} color={failed ? colors.danger : colors.warning} />
      <Text variant="caption" style={{ color: failed ? colors.danger : colors.warning }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minHeight: sizes.touch - 12,
    paddingHorizontal: space.md,
    borderRadius: radius.badge,
  },
});

export default PendingChip;
