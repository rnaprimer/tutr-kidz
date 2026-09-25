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
} as const;

export type ColorName = keyof typeof colors;

export const spacing = {
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
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  },
} as const;
