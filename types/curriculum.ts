export type CurriculumLevel =
  | 'toddler'
  | 'class-1'
  | 'class-2'
  | 'class-3'
  | 'class-4';

export type SubjectId =
  | 'early-learning'
  | 'mathematics';

export type Difficulty =
  | 'easy'
  | 'medium'
  | 'hard';

export type TopicId =
  | 'colours'
  | 'shapes'
  | 'numbers'
  | 'matching'
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'fractions'
  | 'geometry'
  | 'measurement'
  | 'time';

export interface SubjectConfig {
  id: SubjectId;
  title: string;
  description: string;
}

export interface TopicConfig {
  id: TopicId;
  level: CurriculumLevel;
  subject: SubjectId;
  title: string;
  description: string;
  symbol?: string;
}

export interface QuestionSetConfig {
  id: string;
  level: CurriculumLevel;
  subject: SubjectId;
  topic: TopicId;
  difficulty: Difficulty;
  title: string;
}
