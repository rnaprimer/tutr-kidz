import { QuizQuestion, ToddlerActivityId } from '../types/quiz';
import {
  ALL_QUESTIONS,
  getQuestionsForActivity,
  getQuestionsForLevel as getQuestionsForLevelBank,
  getQuestionsForTopic,
} from './questionBank';
import { CurriculumLevel } from '../types/curriculum';

export const TODDLER_ACTIVITIES: Record<ToddlerActivityId, QuizQuestion[]> = {
  colours: getQuestionsForActivity('colours'),
  shapes: getQuestionsForActivity('shapes'),
  numbers: getQuestionsForActivity('numbers'),
  matching: getQuestionsForActivity('matching'),
};

export const SAMPLE_MATH_QUESTIONS: QuizQuestion[] = getQuestionsForTopic(
  'class-1',
  'addition'
);

/**
 * Returns questions for a given level and optional activity or topic.
 * Backwards-compatible with Phase 2/3 callers.
 */
export function getQuestionsForLevel(
  levelId: string,
  activityOrTopicId?: string
): QuizQuestion[] {
  if (levelId === 'toddler') {
    if (activityOrTopicId && activityOrTopicId in TODDLER_ACTIVITIES) {
      return getQuestionsForActivity(activityOrTopicId as ToddlerActivityId);
    }
    return getQuestionsForActivity('colours');
  }

  // Class 1 to Class 4
  const validLevels: CurriculumLevel[] = ['class-1', 'class-2', 'class-3', 'class-4'];
  const curLevel = validLevels.includes(levelId as CurriculumLevel)
    ? (levelId as CurriculumLevel)
    : 'class-1';

  if (activityOrTopicId) {
    const topicQuestions = getQuestionsForTopic(curLevel, activityOrTopicId);
    if (topicQuestions.length > 0) {
      return topicQuestions;
    }
  }

  return getQuestionsForLevelBank(curLevel);
}
