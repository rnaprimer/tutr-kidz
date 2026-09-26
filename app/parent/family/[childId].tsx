import { useDocumentTitle } from "../../../lib/utils/useDocumentTitle";
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { colors, layout, spacing } from '../../../constants/colors';
import { getLevelById } from '../../../constants/levels';
import {
  fetchChildDetailData,
  ChildDetailData,
} from '../../../features/familyInsights/familyInsightRepository';
import { LevelInsightCard } from '../../../components/insights/LevelInsightCard';
import { PracticeInsightCard } from '../../../components/insights/PracticeInsightCard';
import { StrongProgress } from '../../../components/insights/StrongProgress';
import { RecentActivity } from '../../../components/insights/RecentActivity';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { TopicInsight } from '../../../features/insights/insightTypes';
import { useParentAccess } from '../../../features/settings/useParentAccess';
import { ParentLockChallengeModal } from '../../../components/settings/ParentLockChallengeModal';

export default function ChildDetailScreen() {
  useDocumentTitle("Tutr Kidz — Learner Profile");

  const { isLocked, checking, handleUnlockSuccess, handleUnlockCancel } = useParentAccess();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [data, setData] = useState<ChildDetailData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      if (childId) {
        fetchChildDetailData(childId).then((res) => {
          if (isMounted) {
            setData(res);
            setIsLoaded(true);
          }
        });
      }
      return () => {
        isMounted = false;
      };
    }, [childId])
  );

  const handleSelectLevel = (level: string) => {
    router.push({
      pathname: '/level/[level]',
      params: { level },
    });
  };

  const handlePracticeTopic = (topic: TopicInsight) => {
    if (topic.level === 'toddler') {
      router.push('/toddler');
    } else {
      router.push({
        pathname: '/level/[level]/topics',
        params: { level: topic.level },
      });
    }
  };

  if (checking || !isLoaded || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading learner details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    childRecord,
    summary,
    levelInsights,
    strongestTopics,
    practiceTopics,
    recentActivity,
  } = data;

  const childName = childRecord.profile.name;
  const levelConfig = getLevelById(childRecord.profile.level);
  const levelTitle = levelConfig?.title ?? childRecord.profile.level;
  const hasActivity = summary.questionsAnswered > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ParentLockChallengeModal
        visible={isLocked}
        onSuccess={handleUnlockSuccess}
        onCancel={handleUnlockCancel}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>Tutr Kidz</Text>
            <Text style={styles.heading}>{childName}'s Learning</Text>
            <Text style={styles.subtitle}>
              Learning overview and topic progress.
            </Text>
          </View>

          {/* Child Metric Summary Card */}
          <View style={styles.metricsCard}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Level</Text>
              <Text style={styles.metricValue}>{levelTitle}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Questions</Text>
              <Text style={styles.metricValue}>{summary.questionsAnswered}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Quizzes</Text>
              <Text style={styles.metricValue}>{summary.quizzesCompleted}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Accuracy</Text>
              <Text style={styles.metricValue}>{summary.accuracy}%</Text>
            </View>
          </View>

          {/* Detailed Learning Insights Navigation (Phase 15) */}
          <View style={{ marginBottom: spacing.xl }}>
            <PrimaryButton
              label="View Detailed Learning Insights →"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/parent/family/[childId]/insights',
                  params: { childId: childRecord.profile.id },
                })
              }
              accessibilityLabel={`View detailed learning insights for ${childName}`}
            />
          </View>

          {hasActivity ? (
            <View style={styles.mainContent}>
              {/* Suggested Practice */}
              {practiceTopics.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionHeading}>Suggested Practice</Text>
                  <View style={styles.practiceList}>
                    {practiceTopics.map((topic) => (
                      <PracticeInsightCard
                        key={`${topic.level}:${topic.topic}`}
                        topic={topic}
                        onPractice={() => handlePracticeTopic(topic)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Strong Progress */}
              {strongestTopics.length > 0 ? (
                <View style={styles.section}>
                  <StrongProgress topics={strongestTopics} />
                </View>
              ) : null}

              {/* Learning by Level */}
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Learning by Level</Text>
                <View style={styles.levelList}>
                  {levelInsights.map((level) => (
                    <LevelInsightCard
                      key={level.level}
                      insight={level}
                      onPress={() => handleSelectLevel(level.level)}
                    />
                  ))}
                </View>
              </View>

              {/* Recent Activity */}
              {recentActivity.length > 0 ? (
                <View style={styles.section}>
                  <RecentActivity activities={recentActivity} />
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Not started yet</Text>
              <Text style={styles.emptyText}>
                {childName} has not completed any learning activities yet. Practice records will appear here after their first quiz.
              </Text>
            </View>
          )}

          {/* Footer Action */}
          <View style={styles.footer}>
            <PrimaryButton
              label="Back to Family Dashboard"
              variant="tertiary"
              onPress={() => router.back()}
              accessibilityLabel="Back to family dashboard"
              accessibilityHint="Returns to family dashboard"
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
  },
  container: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  metricsCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: spacing.xxl,
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
    elevation: 1,
  },
  metricBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  mainContent: {
    gap: spacing.xxl,
  },
  section: {
    width: '100%',
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  levelList: {
    gap: spacing.xs,
  },
  practiceList: {
    gap: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    width: '100%',
    marginTop: spacing.md,
  },
});
