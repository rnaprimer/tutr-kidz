import { useDocumentTitle } from "../../lib/utils/useDocumentTitle";
import React, { useState, useEffect } from 'react';
import { trackEvent } from '../../lib/analytics';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { colors, layout, spacing } from '../../constants/colors';
import {
  getQuestionsForActivity,
  getQuestionsForTopic,
  getQuestionsForLevel,
  getRandomQuiz,
} from '../../data/questionBank';
import { useQuiz } from '../../features/quiz/useQuiz';
import { QuizProgress } from '../../components/quiz/QuizProgress';
import { QuizOption } from '../../components/quiz/QuizOption';
import { QuizFeedback } from '../../components/quiz/QuizFeedback';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { IllustratedEmptyState } from '../../components/illustrations/IllustratedEmptyState';
import { OptionVisualState, ToddlerActivityId } from '../../types/quiz';
import { selectAdaptiveQuestions, getRecentQuestionIds, recordQuestionExposure } from '../../features/learning/questionSelector';
import { getActiveChildId } from '../../features/family/activeChild';
import { CurriculumLevel } from '../../types/curriculum';
import { QuizVisualRenderer } from '../../components/quiz/QuizVisualRenderer';

export default function QuizScreen() {
  useDocumentTitle("Tutr Kidz — Quiz");

  const {
    level: levelParam,
    activity: activityParam,
    topic: topicParam,
  } = useLocalSearchParams<{
    level: string;
    activity?: string;
    topic?: string;
  }>();

  const levelId = typeof levelParam === 'string' ? levelParam : '';

  useEffect(() => {
    trackEvent('quiz_started', { level: String(levelId || '') });
  }, [levelId]);
  const activityId = typeof activityParam === 'string' ? activityParam : '';
  const topicId = typeof topicParam === 'string' ? topicParam : '';

  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    getActiveChildId().then((cid) => {
      if (cid && isMounted) {
        getRecentQuestionIds(cid, topicId || activityId).then((ids) => {
          if (isMounted) setRecentIds(ids);
        });
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [topicId, activityId]);

  const questions = React.useMemo(() => {
    if (levelId === 'toddler') {
      const actId = (activityId || 'colours') as ToddlerActivityId;
      const raw = getQuestionsForActivity(actId);
      return selectAdaptiveQuestions(raw, {
        count: 5,
        recentQuestionIds: recentIds,
        level: 'toddler',
        topicId: actId,
      });
    }

    const curLevel = levelId as CurriculumLevel;
    if (topicId) {
      const topicQuestions = getQuestionsForTopic(curLevel, topicId);
      return selectAdaptiveQuestions(topicQuestions, {
        recentQuestionIds: recentIds,
        level: curLevel,
        topicId,
      });
    }

    const levelQuestions = getQuestionsForLevel(curLevel);
    return selectAdaptiveQuestions(levelQuestions, {
      recentQuestionIds: recentIds,
      level: curLevel,
    });
  }, [levelId, activityId, topicId, recentIds]);

  const {
    currentIndex,
    selectedOptionId,
    isAnswered,
    isCorrect,
    score,
    currentQuestion,
    totalQuestions,
    isLastQuestion,
    selectOption,
    nextQuestion,
  } = useQuiz(questions);

  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNext = () => {
    if (isTransitioning) return;
    const isFinished = nextQuestion();
    if (isFinished) {
      setIsTransitioning(true);
      getActiveChildId().then((cid) => {
        if (cid) {
          const askedIds = questions.map((q) => q.id);
          recordQuestionExposure(cid, askedIds, topicId || activityId);
        }
      }).catch(() => {});
      router.replace({
        pathname: '/quiz/result',
        params: {
          score: String(score),
          total: String(totalQuestions),
          level: levelId,
          ...(activityId ? { activity: activityId } : {}),
          ...(topicId ? { topic: topicId } : {}),
        },
      });
    }
  };

  // Gracefully handle edge case: no questions found or invalid level
  if (!currentQuestion || totalQuestions === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fallbackContainer}>
          <IllustratedEmptyState
            title="No activities available"
            description="We couldn't find questions for this level yet."
            actionLabel="Return Home"
            onAction={() => router.replace('/')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const correctOption = currentQuestion.options.find(
    (opt) => opt.id === currentQuestion.correctOptionId
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Progress Indicator */}
          <QuizProgress current={currentIndex + 1} total={totalQuestions} />

          {/* Question Area */}
          <View style={[styles.questionArea, styles.questionCard]}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            {currentQuestion.visual ? (
              <View style={styles.questionVisualContainer}>
                <QuizVisualRenderer
                  visual={currentQuestion.visual}
                  size="large"
                />
              </View>
            ) : null}
          </View>

          {/* Options List */}
          <View style={styles.optionsList}>
            {currentQuestion.options.map((option) => {
              let state: OptionVisualState = 'default';

              if (isAnswered) {
                if (option.id === currentQuestion.correctOptionId) {
                  state = 'correct';
                } else if (option.id === selectedOptionId) {
                  state = 'incorrect';
                } else {
                  state = 'neutral-locked';
                }
              }

              return (
                <QuizOption
                  key={option.id}
                  option={option}
                  state={state}
                  disabled={isAnswered}
                  onPress={() => selectOption(option.id)}
                />
              );
            })}
          </View>

          {/* Immediate Feedback */}
          {isAnswered && (
            <QuizFeedback
              isCorrect={!!isCorrect}
              correctOptionLabel={correctOption?.label || ''}
              customCorrectFeedback={currentQuestion.feedbackCorrect}
              customIncorrectFeedback={currentQuestion.feedbackIncorrect}
            />
          )}

          {/* Next / See Results Button */}
          <View style={styles.bottomAction}>
            <PrimaryButton
              label={isLastQuestion ? 'See Results' : 'Next'}
              onPress={handleNext}
              disabled={!isAnswered || isTransitioning}
              accessibilityHint={
                isAnswered
                  ? 'Advances to the next question or result'
                  : 'Answer the question above first'
              }
              style={styles.nextButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.huge,
    justifyContent: 'center',
  },
  contentContainer: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  questionArea: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#EFEFEA',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    marginVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
    elevation: 1,
  },
  questionText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  questionVisualContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    marginVertical: spacing.sm,
  },
  bottomAction: {
    marginTop: spacing.xl,
  },
  nextButton: {
    width: '100%',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  fallbackTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fallbackDesc: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  fallbackButton: {
    minWidth: 200,
  },
});
