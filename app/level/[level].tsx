import { useDocumentTitle } from "../../lib/utils/useDocumentTitle";
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { colors, layout, spacing } from '../../constants/colors';
import { getLevelById } from '../../constants/levels';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { CurriculumLevel } from '../../types/curriculum';
import { ProgressState } from '../../features/progress/types';
import { DEFAULT_PROGRESS, getProgress } from '../../features/progress/progressStorage';
import { getLevelProgress } from '../../features/progress/progressUtils';

export default function LevelDetailScreen() {

  const { level: levelParam } = useLocalSearchParams<{ level: string }>();

  const levelId = (typeof levelParam === 'string' ? levelParam : '') as CurriculumLevel;
  const levelConfig = getLevelById(levelId);
  useDocumentTitle(levelConfig ? `Tutr Kidz — ${levelConfig.title}` : "Tutr Kidz");

  const [progress, setProgress] = useState<ProgressState>(DEFAULT_PROGRESS);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      getProgress().then((data) => {
        if (isMounted) setProgress(data);
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const displayTitle = levelConfig?.title ?? 'Class';
  const displaySubtitle = levelConfig?.subtitle ?? '';

  const progressSummary = getLevelProgress(progress, levelId);
  const isToddler = levelId === 'toddler';

  const handleStart = () => {
    if (levelId === 'toddler') {
      router.push('/toddler');
    } else {
      router.push({
        pathname: '/level/[level]/topics',
        params: { level: levelId },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <View style={styles.topSection}>
            <Text style={styles.brandTitle}>Tutr Kidz</Text>
            <View style={styles.badgeCard}>
              <Text style={styles.levelHeading}>{displayTitle}</Text>
              {displaySubtitle ? (
                <Text style={styles.curriculumText}>{displaySubtitle}</Text>
              ) : null}
            </View>
          </View>

          {/* Level Progress Overview */}
          <View style={styles.progressCard}>
            <Text style={styles.progressHeading}>Your progress</Text>
            {progressSummary.startedTopics > 0 ? (
              <View style={styles.progressStats}>
                <Text style={styles.progressStatText}>
                  {isToddler
                    ? `${progressSummary.startedTopics} of ${progressSummary.totalTopics} activities started`
                    : `${progressSummary.startedTopics} of ${progressSummary.totalTopics} topics started`}
                </Text>
                <Text style={styles.progressAccuracyText}>
                  {progressSummary.accuracy}% accuracy
                </Text>
              </View>
            ) : (
              <Text style={styles.progressEmptyText}>No activity yet.</Text>
            )}
          </View>

          <View style={styles.actionCard}>
            <Text style={styles.promptText}>Ready to learn?</Text>

            <PrimaryButton
              label="Start"
              onPress={handleStart}
              style={styles.startButton}
              accessibilityLabel={`Start learning ${displayTitle}`}
              accessibilityHint={
                levelId === 'toddler'
                  ? 'Opens toddler activity selection'
                  : `Starts quiz for ${displayTitle}`
              }
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
    justifyContent: 'center',
  },
  contentContainer: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  badgeCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
    elevation: 1.5,
  },
  levelHeading: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  curriculumText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
    elevation: 1.5,
  },
  promptText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
    elevation: 1,
  },
  progressHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  progressStatText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  progressAccuracyText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  progressEmptyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  startButton: {
    width: '100%',
  },
});
