import { colors, layout, spacing } from './colors';
import { LevelId } from '../types/level';

export interface LevelTheme {
  name: string;
  bgLight: string;
  borderColor: string;
  accentColor: string;
  textColor: string;
  badgeBg: string;
  emblem: string;
  tagline: string;
}

export const LEVEL_THEMES: Record<LevelId, LevelTheme> = {
  toddler: {
    name: 'Toddler',
    bgLight: colors.warmYellowBg,
    borderColor: colors.warmYellowBorder,
    accentColor: colors.warmYellowAccent,
    textColor: colors.warmYellowText,
    badgeBg: '#FEF9C3',
    emblem: '🌱',
    tagline: 'Colours, shapes & sounds',
  },
  'class-1': {
    name: 'Class 1',
    bgLight: colors.skyBg,
    borderColor: colors.skyBorder,
    accentColor: colors.skyAccent,
    textColor: colors.skyText,
    badgeBg: '#E0F2FE',
    emblem: '🎈',
    tagline: 'Counting, addition & patterns',
  },
  'class-2': {
    name: 'Class 2',
    bgLight: colors.mintBg,
    borderColor: colors.mintBorder,
    accentColor: colors.mintAccent,
    textColor: colors.mintText,
    badgeBg: '#DCFCE7',
    emblem: '🧩',
    tagline: 'Place value, multiplication & time',
  },
  'class-3': {
    name: 'Class 3',
    bgLight: colors.lavenderBg,
    borderColor: colors.lavenderBorder,
    accentColor: colors.lavenderAccent,
    textColor: colors.lavenderText,
    badgeBg: '#EDE9FE',
    emblem: '📐',
    tagline: 'Division, fractions & geometry',
  },
  'class-4': {
    name: 'Class 4',
    bgLight: colors.peachBg,
    borderColor: colors.peachBorder,
    accentColor: colors.peachAccent,
    textColor: colors.peachText,
    badgeBg: '#FFEDD5',
    emblem: '🔭',
    tagline: 'Decimals, areas & multi-step maths',
  },
};

export const theme = {
  colors,
  layout,
  spacing,
  levels: LEVEL_THEMES,
} as const;
