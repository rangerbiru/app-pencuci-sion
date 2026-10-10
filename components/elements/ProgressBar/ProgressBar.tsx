import useTheme from '@/hooks/useTheme';
import { ProgressBarV2 } from '../Motion/Progress';

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  tone?: 'accent' | 'success';
  label: string;
}

/** Bilah progres v2: terisi dari 0 saat tampil (lihat Motion/Progress). API lama dipertahankan. */
function ProgressBar({ value, tone = 'accent', label }: ProgressBarProps) {
  const { colors } = useTheme();
  return (
    <ProgressBarV2
      value={value}
      color={tone === 'success' ? colors.success : colors.accent}
      accessibilityLabel={label}
    />
  );
}

export default ProgressBar;
