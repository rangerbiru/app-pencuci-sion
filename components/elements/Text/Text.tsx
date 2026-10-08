import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { typography, TypographyVariant, ThemeColors } from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: keyof ThemeColors;
  align?: 'left' | 'center' | 'right';
}

function Text({ variant = 'body', color = 'text', align, style, ...others }: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      style={[
        typography[variant],
        { color: colors[color] },
        align ? { textAlign: align } : null,
        styles.base,
        style,
      ]}
      {...others}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});

export default Text;
