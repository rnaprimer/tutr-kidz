import { useDocumentTitle } from "../../lib/utils/useDocumentTitle";
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { colors, layout, spacing } from '../../constants/colors';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { getLevelById } from '../../constants/levels';
import { getTopicConfig } from '../../data/curriculum';
import { CurriculumLevel } from '../../types/curriculum';
import { getProgress, recordQuizResult } from '../../features/progress/progressStorage';
import { trackEvent } from '../../lib/analytics';

export default function QuizResultScreen() {
  useDocumentTitle("Tutr Kidz — Quiz Results");

  const params = useLocalSearchParams<{
    score?: string;
    total?: string;
    level?: string;
    activity?: string;
    topic?: string;
  }>();

  const rawScore = parseInt(params.score || '0', 10);
  const rawTotal = parseInt(params.total || '0', 10);
  const safeScore = isNaN(rawScore) ? 0 : Math.max(0, rawScore);
  const safeTotal = isNaN(rawTotal) ? 0 : Math.max(0, rawTotal);
  const score = safeTotal > 0 ? Math.min(safeScore, safeTotal) : safeScore;
  const total = safeTotal;
  const levelId = (params.level || '') as CurriculumLevel;
  const activityId = params.activity || '';
  const topicId = params.topic || '';
  const levelConfig = getLevelById(levelId);

  const isToddler = levelId === 'toddler';
  const topicOrActivity = topicId || activityId || 'general';
  const topicConfig = topicId
    ? getTopicConfig(levelId, topicId)
    : undefined;

  const [previousBest, setPreviousBest] = useState<{ score: number; total: number } | null>(null);
  const hasRecordedRef = useRef(false);

  useEffect(() => {
    if (hasRecordedRef.current) return;
    if (!levelId || total <= 0) return;
    hasRecordedRef.current = true;

    const record = async () => {
      try {
        const current = await getProgress();
        const key = `${levelId}:${topicOrActivity}`;
        const prev = current.topics[key];
        if (prev && prev.attempts >= 1) {
          setPreviousBest({ score: prev.bestScore, total: prev.bestTotal });
        }
        trackEvent('quiz_completed', { level: String(levelId || ''), score, total });
        await recordQuizResult({
          level: levelId,
          topic: topicOrActivity,
          score,
          total,
        });
      } catch {
        // Safe fail
      }
    };

    record();
  }, [levelId, topicOrActivity, score, total]);

  const handleTryAgain = () => {
    if (levelId) {
      router.replace({
        pathname: '/quiz/[level]',
        params: {
          level: levelId,
          ...(activityId ? { activity: activityId } : {}),
          ...(topicId ? { topic: topicId } : {}),
        },
      });
    } else {
      router.replace('/');
    }
  };

  const handleChooseAnother = () => {
    if (isToddler) {
      router.replace('/toddler');
    } else {
      router.replace({
        pathname: '/level/[level]/topics',
        params: { level: levelId },
      });
    }
  };

  const handleHome = () => {
    router.replace('/');
  };

  if (total <= 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.contentContainer, { paddingHorizontal: spacing.xl, justifyContent: 'center', flex: 1, alignItems: 'center' }]}>
          <Text style={[styles.brandTitle, { marginBottom: spacing.md }]}>Tutr Kidz</Text>
          <Text style={[styles.heading, { textAlign: 'center', marginBottom: spacing.sm }]}>No Quiz Results</Text>
          <Text style={[styles.summaryText, { textAlign: 'center', marginBottom: spacing.xl }]}>
            Complete a quiz to see your learning results here.
          </Text>
          <PrimaryButton
            label="Return Home"
            onPress={handleHome}
            style={{ width: '100%', maxWidth: 280 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const subtitleText = (() => {
    if (isToddler && activityId) {
      return `Toddler · ${activityId.charAt(0).toUpperCase() + activityId.slice(1)}`;
    }
    if (topicConfig && levelConfig) {
      return `${levelConfig.title} · ${topicConfig.title}`;
    }
    return levelConfig?.title ?? '';
  })();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <View style={styles.headerSection}>
            <Text style={styles.brandTitle}>Tutr Kidz</Text>
            {subtitleText ? (
              <Text style={styles.levelSubtitle}>{subtitleText}</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>
              {isToddler ? 'Great work! 🎉' : 'Great job!'}
            </Text>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>
                {score} / {total}
              </Text>
              {previousBest ? (
                <Text style={styles.bestScoreText}>
                  Best for this topic: {previousBest.score} / {previousBest.total}
                </Text>
              ) : null}
            </View>

            <Text style={styles.summaryText}>
              {isToddler
                ? `You got ${score} right. You're learning!`
                : `You got ${score} question${score === 1 ? '' : 's'} correct.`}
            </Text>

            <View style={styles.actions}>
              {/* Primary action */}
              <PrimaryButton
                label="Try Again"
                variant="primary"
                onPress={handleTryAgain}
                style={styles.actionButton}
                accessibilityLabel="Try quiz again"
                accessibilityHint="Restarts this activity from the first question"
              />

              {/* Secondary action (Choose Another topic/activity) */}
              <PrimaryButton
                label={isToddler ? 'Choose Another' : 'Choose Another Topic'}
                variant="secondary"
                onPress={handleChooseAnother}
                style={styles.actionButton}
                accessibilityLabel={
                  isToddler ? 'Choose another toddler activity' : 'Choose another topic'
                }
                accessibilityHint={
                  isToddler
                    ? 'Navigates back to the toddler activity selection screen'
                    : 'Navigates back to topic selection'
                }
              />

              {/* Tertiary action */}
              <PrimaryButton
                label="Home"
                variant="tertiary"
                onPress={handleHome}
                style={styles.actionButton}
                accessibilityLabel="Return home"
                accessibilityHint="Navigates back to the home screen"
              />
            </View>
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
    paddingVertical: spacing.xxl,
    justifyContent: 'center',
  },
  contentContainer: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.3,
  },
  levelSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
    elevation: 2,
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  scoreContainer: {
    backgroundColor: colors.background,
    borderRadius: layout.borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -1,
    textAlign: 'center',
  },
  bestScoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  summaryText: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
});
