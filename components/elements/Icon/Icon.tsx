import { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';

export type IconName = ComponentProps<typeof Feather>['name'];

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  /** label untuk pembaca layar; tanpa label ikon dianggap hiasan */
  accessibilityLabel?: string;
}

function Icon({ name, size = 24, color, accessibilityLabel }: IconProps) {
  const { colors } = useTheme();
  return (
    <Feather
      name={name}
      size={size}
      color={color ?? colors.text}
      accessibilityLabel={accessibilityLabel}
      accessible={!!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    />
  );
}

export default Icon;
