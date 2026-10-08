import { StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { BadgeTone, radius, space, StatusKind, statusTone } from '@/theme';
import { Status } from '@/types';
import Text from '../Text';
import Icon, { IconName } from '../Icon';

export interface BadgeProps {
  /** status dari API; label ditampilkan apa adanya */
  status?: Status | null;
  /** jenis status di tokens.json untuk memilih warna */
  kind?: StatusKind;
  /** atau label + warna langsung */
  label?: string;
  tone?: BadgeTone;
  icon?: IconName;
  /** konteks di depan label API, mis. "Upah" -> "Upah: Tertahan" */
  prefix?: string;
}

const TONE_ICON: Record<BadgeTone, IconName> = {
  gold: 'clock',
  accent: 'check',
  error: 'x',
  primary: 'circle',
  neutral: 'minus',
};

/** Badge status: teks + ikon, warna dari tokens (bukan warna saja). */
function Badge({ status, kind, label, tone, icon, prefix }: BadgeProps) {
  const { badges } = useTheme();
  const text = label ?? status?.label;
  if (!text) return null;
  const resolved: BadgeTone = tone ?? (kind ? statusTone(kind, status?.code) : 'neutral');
  const c = badges[resolved];
  return (
    <View
      style={[styles.root, { backgroundColor: c.bg }]}
      accessible
      accessibilityLabel={`${prefix ?? 'Status'}: ${text}`}>
      <Icon name={icon ?? TONE_ICON[resolved]} size={12} color={c.text} />
      <Text variant="caption" style={{ color: c.text }}>
        {prefix ? `${prefix}: ` : ''}
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
    paddingHorizontal: 10,
    paddingVertical: space.xxs,
    borderRadius: radius.badge,
  },
});

export default Badge;
