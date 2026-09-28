import { useDocumentTitle } from "../../lib/utils/useDocumentTitle";
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { colors, layout, spacing } from '../../constants/colors';
import { getLevelById } from '../../constants/levels';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { IllustratedHeader } from '../../components/illustrations/IllustratedHeader';
import { CurriculumLevel } from '../../types/curriculum';
import { LevelId } from '../../types/level';
import { ProgressState } from '../../features/progress/types';
import { DEFAULT_PROGRESS, getProgress } from '../../features/progress/progressStorage';
import { getLevelProgress } from '../../features/progress/progressUtils';
import { LEVEL_THEMES } from '../../constants/theme';

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

  if (!levelConfig) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.contentContainer, { paddingHorizontal: spacing.xl, justifyContent: 'center', flex: 1, alignItems: 'center' }]}>
          <Text style={styles.brandTitle}>Tutr Kidz</Text>
          <Text style={[styles.levelHeading, { fontSize: 24, marginVertical: spacing.md }]}>
            That learning level isn't available.
          </Text>
          <Text style={[styles.curriculumText, { marginBottom: spacing.xl }]}>
            Please select one of the available classes or toddler activities.
          </Text>
          <PrimaryButton
            label="Return Home"
            onPress={() => router.replace('/')}
            style={{ width: '100%', maxWidth: 280 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const displayTitle = levelConfig?.title ?? 'Class';
  const displaySubtitle = levelConfig?.subtitle ?? '';

  const progressSummary = getLevelProgress(progress, levelId);
  const isToddler = levelId === 'toddler';
  const theme = LEVEL_THEMES[levelId as LevelId] || LEVEL_THEMES.toddler;

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
          {/* Illustrated Level Header */}
          <IllustratedHeader
            levelId={levelId as LevelId}
            title={displayTitle}
            subtitle={displaySubtitle}
          />

          {/* Level Progress Overview */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressIcon}>📊</Text>
              <Text style={styles.progressHeading}>Your progress</Text>
            </View>

            {progressSummary.startedTopics > 0 ? (
              <View style={styles.progressStats}>
                <Text style={styles.progressStatText}>
                  {isToddler
                    ? `${progressSummary.startedTopics} of ${progressSummary.totalTopics} activities started`
                    : `${progressSummary.startedTopics} of ${progressSummary.totalTopics} topics started`}
                </Text>
                {!isToddler ? (
                  <View style={styles.accuracyBadge}>
                    <Text style={styles.progressAccuracyText}>
                      {progressSummary.accuracy}% accuracy
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <Text style={styles.progressEmptyText}>Ready for your first session!</Text>
            )}
          </View>

          <View style={[styles.actionCard, { borderColor: theme.borderColor }]}>
            <Text style={styles.promptIcon}>{theme.emblem}</Text>
            <Text style={styles.promptText}>Ready to learn?</Text>
            <Text style={styles.promptSubtext}>Take it at your own calm pace.</Text>

            <PrimaryButton
              label="Start"
              onPress={handleStart}
              style={[styles.startButton, { backgroundColor: theme.accentColor }]}
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
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  levelHeading: {
    fontSize: 28,
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
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
    elevation: 2,
  },
  promptIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  promptText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  promptSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#EFEFEA',
    padding: spacing.xl,
    marginBottom: spacing.xl,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
    elevation: 1,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  progressIcon: {
    fontSize: 16,
  },
  progressHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  progressStatText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  accuracyBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: layout.borderRadius.round,
  },
  progressAccuracyText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  progressEmptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  startButton: {
    width: '100%',
  },
});
