import { useDocumentTitle } from "../lib/utils/useDocumentTitle";
import React, { useEffect } from 'react';
import { trackEvent } from '../lib/analytics';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors, layout, spacing } from '../constants/colors';
import { getLevelById, LEVELS } from '../constants/levels';
import { LevelCard } from '../components/ui/LevelCard';
import { LevelConfig } from '../types/level';
import { CurriculumLevel } from '../types/curriculum';
import { ProgressState } from '../features/progress/types';
import { DEFAULT_PROGRESS, getProgress } from '../features/progress/progressStorage';
import { getOverallAccuracy } from '../features/progress/progressUtils';
import { ProgressSummary } from '../components/progress/ProgressSummary';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ChildRecord, FamilyState } from '../features/family/familyTypes';
import { getFamilyState } from '../features/family/familyStorage';
import { runFamilyMigration } from '../features/family/familyMigration';
import {
  getChildDisplayName,
  getDailyQuestionGoal,
  getTodayQuestionsAnswered,
  shouldShowLevel,
} from '../features/profile/profileUtils';
import { DailyPracticeCard } from '../components/dailyLearning/DailyPracticeCard';
import { TodayProgress } from '../components/dailyLearning/TodayProgress';
import { fetchDailyRecommendation } from '../features/dailyLearning/dailyLearningRepository';
import { DailyLearningRecommendation } from '../features/dailyLearning/dailyLearningTypes';

export default function HomeScreen() {
  useEffect(() => {
    trackEvent('app_opened');
  }, []);
  useDocumentTitle("Tutr Kidz");

  const [progress, setProgress] = React.useState<ProgressState>(DEFAULT_PROGRESS);
  const [activeChildRecord, setActiveChildRecord] = React.useState<ChildRecord | null>(null);
  const [hasMultipleChildren, setHasMultipleChildren] = React.useState<boolean>(false);
  const [recommendation, setRecommendation] = React.useState<DailyLearningRecommendation | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;

      const load = async () => {
        await runFamilyMigration();
        const family: FamilyState = await getFamilyState();
        if (!isMounted) return;

        const totalChildren = Object.keys(family.children).length;
        setHasMultipleChildren(totalChildren > 1);

        if (family.activeChildId && family.children[family.activeChildId]) {
          const active = family.children[family.activeChildId];
          setActiveChildRecord(active);
          const [prog, rec] = await Promise.all([
            getProgress(active.profile.id),
            fetchDailyRecommendation(active.profile.id),
          ]);
          if (isMounted) {
            setProgress(prog);
            setRecommendation(rec);
          }
        } else {
          setActiveChildRecord(null);
          setRecommendation(null);
          const prog = await getProgress(null);
          if (isMounted) setProgress(prog);
        }
      };

      load();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleSelectLevel = (level: LevelConfig) => {
    router.push({
      pathname: '/level/[level]',
      params: { level: level.id },
    });
  };

  const handleViewProgress = () => {
    router.push('/progress');
  };

  const accuracy = getOverallAccuracy(progress);
  const childName = getChildDisplayName(activeChildRecord);
  const hasProfile = !!activeChildRecord;
  const todayQuestions = getTodayQuestionsAnswered(progress);
  const dailyGoal = getDailyQuestionGoal(activeChildRecord);

  const levelConfig = activeChildRecord ? getLevelById(activeChildRecord.profile.level) : null;
  const levelTitle = levelConfig?.title ?? (activeChildRecord ? activeChildRecord.profile.level : '');

  const visibleLevels = LEVELS.filter((level) =>
    shouldShowLevel(activeChildRecord, level.id as CurriculumLevel)
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>Tutr Kidz</Text>
            {hasProfile ? (
              <Text style={styles.greeting}>Good to see you, {childName}</Text>
            ) : (
              <Text style={styles.tagline}>Small Questions.{'\n'}Big Learning.</Text>
            )}
          </View>

          {/* Child Switcher (when active child exists) */}
          {hasProfile ? (
            <Pressable
              onPress={() => router.push('/parent/children')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Learning as ${childName}, ${levelTitle}. Switch learner.`}
              accessibilityHint="Navigates to the learner selection screen"
              style={({ pressed }) => [
                styles.learnerSwitcherCard,
                pressed && styles.learnerSwitcherPressed,
              ]}
            >
              <View style={styles.learnerSwitcherInfo}>
                <Text style={styles.learnerSwitcherLabel}>Learning as</Text>
                <Text style={styles.learnerSwitcherName}>
                  {childName} · {levelTitle}
                </Text>
              </View>
              <Text style={styles.learnerSwitcherActionText}>
                {hasMultipleChildren ? 'Switch learner →' : 'Learners →'}
              </Text>
            </Pressable>
          ) : null}

          {/* Today's Learning Recommendation */}
          {recommendation ? (
            <DailyPracticeCard
              recommendation={recommendation}
              onPress={() => router.push(recommendation.actionRoute as any)}
            />
          ) : null}

          {/* Today's Practice Status */}
          {recommendation ? (
            <TodayProgress
              questionsAnsweredToday={recommendation.questionsAnsweredToday}
              dailyQuestionGoal={recommendation.dailyQuestionGoal}
              isGoalEnabled={recommendation.isGoalEnabled}
            />
          ) : hasProfile ? (
            <TodayProgress
              questionsAnsweredToday={todayQuestions}
              dailyQuestionGoal={dailyGoal}
              isGoalEnabled={true}
            />
          ) : null}

          {/* Learning Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>What are you learning?</Text>
          </View>

          <View style={styles.levelList}>
            {visibleLevels.map((level) => {
              const isChildLevel = hasProfile && activeChildRecord?.profile?.level === level.id;

              return (
                <View key={level.id} style={styles.levelItemWrapper}>
                  {isChildLevel && activeChildRecord?.preferences?.showAllLevels ? (
                    <View style={styles.yourLevelBadge}>
                      <Text style={styles.yourLevelBadgeText}>Your level</Text>
                    </View>
                  ) : null}
                  <LevelCard
                    level={level}
                    onPress={() => handleSelectLevel(level)}
                    style={isChildLevel ? styles.levelCardHighlighted : undefined}
                  />
                </View>
              );
            })}
          </View>

          {/* Progress & Parent Area */}
          <View style={styles.progressContainer}>
            <ProgressSummary
              questionsAnswered={progress.overall.totalQuestionsAnswered}
              correctAnswers={progress.overall.totalCorrectAnswers}
              accuracy={accuracy}
              onViewAll={handleViewProgress}
            />

            <PrimaryButton
              label="View Progress →"
              variant="tertiary"
              onPress={handleViewProgress}
              style={styles.actionButton}
              accessibilityLabel="View detailed learning progress"
              accessibilityHint="Navigates to the progress details screen"
            />

            <PrimaryButton
              label="Parent Dashboard →"
              variant="tertiary"
              onPress={() => router.push('/parent')}
              style={styles.actionButton}
              accessibilityLabel="View parent dashboard"
              accessibilityHint="Navigates to the parent dashboard and learning insights"
            />

            <PrimaryButton
              label="Family Dashboard →"
              variant="tertiary"
              onPress={() => router.push('/parent/family')}
              style={styles.actionButton}
              accessibilityLabel="View family dashboard"
              accessibilityHint="Navigates to the family overview for all learners"
            />

            {!hasProfile ? (
              <PrimaryButton
                label="Set up learner profile →"
                variant="tertiary"
                onPress={() => router.push('/profile')}
                style={styles.actionButton}
                accessibilityLabel="Set up learner profile"
                accessibilityHint="Navigates to create learner profile"
              />
            ) : null}
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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.huge,
  },
  contentContainer: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  header: {
    marginBottom: spacing.lg,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.accent,
    lineHeight: 25,
    letterSpacing: -0.2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -0.4,
  },
  learnerSwitcherCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  learnerSwitcherPressed: {
    backgroundColor: colors.cardPressed,
  },
  learnerSwitcherInfo: {
    flex: 1,
  },
  learnerSwitcherLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  learnerSwitcherName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 1,
  },
  learnerSwitcherActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    marginLeft: spacing.sm,
  },
  dailyPracticeSection: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  levelList: {
    gap: 2,
    marginBottom: spacing.xxl,
  },
  levelItemWrapper: {
    marginVertical: 2,
  },
  yourLevelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: layout.borderRadius.sm,
    marginBottom: 4,
    marginLeft: 4,
  },
  yourLevelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  levelCardHighlighted: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  progressContainer: {
    gap: spacing.md,
  },
  actionButton: {
    width: '100%',
  },
});
