import { ReactNode, useId } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import useTheme from '@/hooks/useTheme';
import { palette, radius, shadow, space } from '@/theme';

/** Warna di atas kartu hero navy (sama di kedua mode). */
export const onHero = {
  text: palette.white,
  muted: 'rgba(255,255,255,0.72)',
  glass: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.12)',
  track: 'rgba(255,255,255,0.16)',
} as const;

/**
 * Kartu hero berwarna merek: gradasi navy diagonal (SVG, tanpa blur). Satu per layar.
 * Mode gelap memakai navy lebih gelap dan garis tipis supaya tetap terpisah dari latar.
 */
function HeroSurface({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { isDark } = useTheme();
  const gid = `hero${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const from = isDark ? palette.primary['700'] : palette.primary['600'];
  const to = palette.primary['500'];
  return (
    <View
      style={[
        styles.root,
        shadow.hero,
        isDark && { borderWidth: 1, borderColor: onHero.glassBorder },
        style,
      ]}>
      <View style={[StyleSheet.absoluteFill, styles.clip]} pointerEvents="none">
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={from} />
              <Stop offset="1" stopColor={to} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gid})`} />
        </Svg>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: radius.hero, padding: space.xl, gap: space.lg },
  clip: { borderRadius: radius.hero, overflow: 'hidden' },
});

export default HeroSurface;
