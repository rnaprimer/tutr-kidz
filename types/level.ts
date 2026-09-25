export type LevelId = 'toddler' | 'class-1' | 'class-2' | 'class-3' | 'class-4';

export interface LevelConfig {
  id: LevelId;
  title: string;
  subtitle: string;
}
