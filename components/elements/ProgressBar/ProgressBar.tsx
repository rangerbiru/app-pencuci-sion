import { StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { radius } from '@/theme';

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  tone?: 'accent' | 'success';
  label: string;
}

function ProgressBar({ value, tone = 'accent', label }: ProgressBarProps) {
  const { colors } = useTheme();
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      style={[styles.track, { backgroundColor: colors.border }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${pct}%`,
            backgroundColor: tone === 'success' ? colors.success : colors.accent,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: radius.badge, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.badge },
});

export default ProgressBar;
