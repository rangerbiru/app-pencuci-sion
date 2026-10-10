import { Easing } from 'react-native-reanimated';

/**
 * Token gerak v2 (docs/DESIGN_MOBILE.md, "Arah visual v2"). Semua animasi memakai nilai di sini
 * supaya terasa satu keluarga. Durasi perubahan UI 150 s.d. 300 ms.
 */
export const duration = {
  press: 120,
  exit: 150,
  enter: 220,
  accordion: 220,
  toast: 240,
  sheet: 280,
  progress: 700,
  countUp: 600,
  pulse: 1200,
} as const;

export const easing = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.quad),
} as const;

export const spring = {
  press: { damping: 18, stiffness: 320, mass: 0.6 },
  sheet: { damping: 22, stiffness: 220 },
  pop: { damping: 10, stiffness: 260, mass: 0.6 },
  slide: { damping: 20, stiffness: 240, mass: 0.7 },
} as const;

export const stagger = {
  stepMs: 35,
  maxItems: 8,
  offsetY: 8,
} as const;

export const pressScale = 0.97;
