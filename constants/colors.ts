export const colors = {
  background: '#FAFAF7',
  card: '#FFFFFF',
  cardPressed: '#F5F5F2',
  text: '#171717',
  textSecondary: '#6B7280',
  textMuted: '#8A8A8A',
  accent: '#4F46E5',
  accentPressed: '#4338CA',
  accentLight: '#EEF2FF',
  border: '#E5E5E5',
  borderLight: '#F0F0EE',
  success: '#22C55E',
  error: '#EF4444',
  white: '#FFFFFF',

  // Supporting Warm & Playful Palette (Headspace-inspired warmth)
  lavenderBg: '#F5F3FF',
  lavenderBorder: '#DDD6FE',
  lavenderText: '#6D28D9',
  lavenderAccent: '#7C3AED',

  skyBg: '#F0F9FF',
  skyBorder: '#BAE6FD',
  skyText: '#0369A1',
  skyAccent: '#0284C7',

  warmYellowBg: '#FEFCE8',
  warmYellowBorder: '#FEF08A',
  warmYellowText: '#B45309',
  warmYellowAccent: '#D97706',

  coralBg: '#FFF1F2',
  coralBorder: '#FECDD3',
  coralText: '#BE123C',
  coralAccent: '#E11D48',

  mintBg: '#F0FDF4',
  mintBorder: '#BBF7D0',
  mintText: '#15803D',
  mintAccent: '#16A34A',

  peachBg: '#FFF7ED',
  peachBorder: '#FED7AA',
  peachText: '#C2410C',
  peachAccent: '#EA580C',
} as const;

export type ColorName = keyof typeof colors;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

export const layout = {
  maxWidth: 540,
  borderRadius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    round: 9999,
  },
  shadows: {
    subtle: "0 2px 6px rgba(0, 0, 0, 0.03)",
    soft: "0 4px 12px rgba(0, 0, 0, 0.04)",
    elevated: "0 8px 24px rgba(79, 70, 229, 0.07)",
  },
} as const;
