import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import useTheme from '@/hooks/useTheme';
import {
  MAX_FONT_SCALE,
  type2,
  Type2Variant,
  typography,
  TypographyVariant,
  ThemeColors,
} from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  /** skala huruf v2; bila diisi menggantikan `variant` */
  type?: Type2Variant;
  color?: keyof ThemeColors;
  align?: 'left' | 'center' | 'right';
}

function Text({
  variant = 'body',
  type,
  color = 'text',
  align,
  style,
  maxFontSizeMultiplier = MAX_FONT_SCALE,
  ...others
}: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        type ? type2[type] : typography[variant],
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
