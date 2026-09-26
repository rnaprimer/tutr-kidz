import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors, layout, spacing } from '../../constants/colors';
import { ProgressState } from '../../features/progress/types';
import {
  DEFAULT_PROGRESS,
  getProgress,
  resetProgress,
} from '../../features/progress/progressStorage';
import {
  getOverallAccuracy,
  getRecentTopics,
} from '../../features/progress/progressUtils';
import { ProgressSummary } from '../../components/progress/ProgressSummary';
import { RecentActivity } from '../../components/progress/RecentActivity';
import { PrimaryButton } from '../../components/ui/PrimaryButton';

export default function ProgressScreen() {
  const [progress, setProgress] = useState<ProgressState>(DEFAULT_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);

  const loadProgress = async () => {
    const data = await getProgress();
    setProgress(data);
    setIsLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProgress();
    }, [])
  );

  const hasHistory = progress.overall.totalQuestionsAnswered > 0;
  const overallAccuracy = getOverallAccuracy(progress);
  const recentTopics = getRecentTopics(progress, 5);

  const handleReset = async () => {
    await resetProgress();
    await loadProgress();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.brandTitle}>Tutr Kidz</Text>
            <Text style={styles.screenHeading}>Your Progress</Text>
          </View>

          {hasHistory ? (
            <View style={styles.content}>
              <ProgressSummary
                title="Overall"
                questionsAnswered={progress.overall.totalQuestionsAnswered}
                correctAnswers={progress.overall.totalCorrectAnswers}
                accuracy={overallAccuracy}
                style={styles.summaryCard}
              />

              <RecentActivity records={recentTopics} style={styles.recentSection} />

              <View style={styles.actions}>
                <PrimaryButton
                  label="Back"
                  variant="tertiary"
                  onPress={() => router.back()}
                  accessibilityLabel="Go back"
                  accessibilityHint="Returns to previous screen"
                />
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  Your learning journey starts here.
                </Text>
                <Text style={styles.emptyDesc}>
                  Complete a quiz to see your progress.
                </Text>
              </View>

              <View style={styles.actions}>
                <PrimaryButton
                  label="Start Learning"
                  variant="primary"
                  onPress={() => router.replace('/')}
                  accessibilityLabel="Start learning"
                  accessibilityHint="Navigates to home screen"
                />
              </View>
            </View>
          )}
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
  contentContainer: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  screenHeading: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  content: {
    gap: spacing.xxl,
  },
  summaryCard: {
    width: '100%',
  },
  recentSection: {
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    gap: spacing.xxl,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
    elevation: 1.5,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.4,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
});
