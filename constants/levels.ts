import { LevelConfig, LevelId } from '../types/level';

export const LEVELS: readonly LevelConfig[] = [
  {
    id: 'toddler',
    title: 'Toddler',
    subtitle: 'Colours · Shapes · Numbers',
  },
  {
    id: 'class-1',
    title: 'Class 1',
    subtitle: 'Basic maths · Counting · Shapes',
  },
  {
    id: 'class-2',
    title: 'Class 2',
    subtitle: 'Arithmetic · Multiplication · Time',
  },
  {
    id: 'class-3',
    title: 'Class 3',
    subtitle: 'Multiplication · Division · Fractions',
  },
  {
    id: 'class-4',
    title: 'Class 4',
    subtitle: 'Arithmetic · Fractions · Geometry',
  },
] as const;

export function getLevelById(id: string): LevelConfig | undefined {
  return LEVELS.find((level) => level.id === id);
}

export function isValidLevelId(id: string): id is LevelId {
  return LEVELS.some((level) => level.id === id);
}
