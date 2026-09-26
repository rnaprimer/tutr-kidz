import { useDocumentTitle } from "../../lib/utils/useDocumentTitle";
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors, layout, spacing } from '../../constants/colors';
import { getLevelById } from '../../constants/levels';
import {
  fetchParentDashboardData,
  ParentDashboardData,
} from '../../features/insights/insightRepository';
import { getProgress } from '../../features/progress/progressStorage';
import { getFamilyState } from '../../features/family/familyStorage';
import { ChildRecord, FamilyState } from '../../features/family/familyTypes';
import { getChildDisplayName, getTodayQuestionsAnswered } from '../../features/profile/profileUtils';
import { LevelInsightCard } from '../../components/insights/LevelInsightCard';
import { PracticeInsightCard } from '../../components/insights/PracticeInsightCard';
import { StrongProgress } from '../../components/insights/StrongProgress';
import { RecentActivity } from '../../components/insights/RecentActivity';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TopicInsight } from '../../features/insights/insightTypes';
import { useParentAccess } from '../../features/settings/useParentAccess';
import { ParentLockChallengeModal } from '../../components/settings/ParentLockChallengeModal';
import { isParentUnlocked, lockParent } from '../../features/settings/parentSession';
import { isParentLockEnabled } from '../../features/settings/parentLock';
import { fetchDailyRecommendation } from '../../features/dailyLearning/dailyLearningRepository';
import { DailyLearningRecommendation } from '../../features/dailyLearning/dailyLearningTypes';

export default function ParentDashboardScreen() {
  useDocumentTitle("Tutr Kidz — Parent Dashboard");

  const { isLocked, checking, handleUnlockSuccess, handleUnlockCancel } = useParentAccess();
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [activeChildRecord, setActiveChildRecord] = useState<ChildRecord | null>(null);
  const [hasMultipleChildren, setHasMultipleChildren] = useState<boolean>(false);
  const [todayQuestions, setTodayQuestions] = useState<number>(0);
  const [lockEnabled, setLockEnabled] = useState<boolean>(false);
  const [dailyFocus, setDailyFocus] = useState<DailyLearningRecommendation | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;

      const load = async () => {
        const family: FamilyState = await getFamilyState();
        if (!isMounted) return;

        const totalChildren = Object.keys(family.children).length;
        setHasMultipleChildren(totalChildren > 1);

        const activeId = family.activeChildId;
        const active = activeId ? family.children[activeId] ?? null : null;
        setActiveChildRecord(active);

        const [dashboardData, progress, isLockActive, rec] = await Promise.all([
          fetchParentDashboardData(activeId),
          getProgress(activeId),
          isParentLockEnabled(),
          fetchDailyRecommendation(activeId),
        ]);

        if (isMounted) {
          setData(dashboardData);
          setTodayQuestions(getTodayQuestionsAnswered(progress));
          setLockEnabled(isLockActive);
          setDailyFocus(rec);
        }
      };

      load();

      return () => {
        isMounted = false;
      };
    }, [])
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

  if (checking || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading overview...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    hasData,
    overallAccuracy,
    levelInsights,
    strongestTopics,
    practiceTopics,
    recentActivity,
    learningSummary,
  } = data;

  const childName = getChildDisplayName(activeChildRecord);
  const childLevel = activeChildRecord?.profile?.level;
  const levelConfig = childLevel ? getLevelById(childLevel) : null;
  const levelTitle = levelConfig?.title ?? (childLevel || 'None');

  const handleManualLock = () => {
    lockParent();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ParentLockChallengeModal
        visible={isLocked}
        onSuccess={handleUnlockSuccess}
        onCancel={handleUnlockCancel}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>Tutr Kidz</Text>
            {childName ? (
              <Text style={styles.childHeaderName}>{childName}</Text>
            ) : null}
            <Text style={styles.screenHeading}>Learning Overview</Text>
            <Text style={styles.subtitle}>See how learning is progressing.</Text>

            <View style={styles.headerActions}>
              <PrimaryButton
                label="Family Dashboard →"
                variant="secondary"
                onPress={() => router.push('/parent/family')}
                style={styles.headerButton}
                accessibilityLabel="Family Dashboard"
                accessibilityHint="Navigates to family overview across all learners"
              />
              <PrimaryButton
                label="Switch learner →"
                variant="tertiary"
                onPress={() => router.push('/parent/children')}
                style={styles.headerButton}
                accessibilityLabel="Switch learner"
                accessibilityHint="Navigates to learner selector"
              />
              <PrimaryButton
                label="Parent Settings →"
                variant="tertiary"
                onPress={() => router.push('/parent/settings')}
                style={styles.headerButton}
                accessibilityLabel="Parent settings"
                accessibilityHint="Navigates to parent settings and preferences"
              />
              <PrimaryButton
                label="Data & Privacy →"
                variant="tertiary"
                onPress={() => router.push('/parent/data')}
                style={styles.headerButton}
                accessibilityLabel="Data and privacy"
                accessibilityHint="Navigates to data and privacy management"
              />
              {lockEnabled && isParentUnlocked() ? (
                <PrimaryButton
                  label="Lock controls"
                  variant="tertiary"
                  onPress={handleManualLock}
                  style={styles.headerButton}
                  accessibilityLabel="Lock parent controls"
                  accessibilityHint="Locks parent controls and returns home"
                />
              ) : null}
            </View>
          </View>

          {/* Child Learning Metrics Overview */}
          <View style={styles.metricsCard}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Current level</Text>
              <Text style={styles.metricValue}>{levelTitle}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Today's practice</Text>
              <Text style={styles.metricValue}>{todayQuestions} questions</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Overall accuracy</Text>
              <Text style={styles.metricValue}>{overallAccuracy}%</Text>
            </View>
          </View>

          {hasData ? (
            <View style={styles.mainContent}>
              {/* Today's Learning Focus */}
              {dailyFocus && dailyFocus.reason !== 'none' ? (
                <View style={styles.focusCard}>
                  <Text style={styles.focusEyebrow}>Today's Learning Focus</Text>
                  <Text style={styles.focusTitle}>{dailyFocus.title}</Text>
                  <Text style={styles.focusDescription}>{dailyFocus.description}</Text>
                </View>
              ) : null}

              {/* Learning Overview (Phase 15) */}
              {learningSummary ? (
                <View style={styles.learningOverviewCard}>
                  <View style={styles.overviewHeaderRow}>
                    <Text style={styles.overviewTitle}>Learning overview</Text>
                    {activeChildRecord ? (
                      <TouchableOpacity
                        onPress={() => router.push(`/parent/family/${activeChildRecord.profile.id}/insights`)}
                        style={styles.overviewInsightsLink}
                        accessibilityRole="link"
                        accessibilityLabel="View detailed learning insights"
                      >
                        <Text style={styles.overviewInsightsLinkText}>Details →</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <View style={styles.overviewStatsRow}>
                    <Text style={styles.overviewStatPill}>
                      {learningSummary.topicsExplored} topics explored
                    </Text>
                    <Text style={styles.overviewStatDot}>•</Text>
                    <Text style={styles.overviewStatPill}>
                      {learningSummary.questionsAnswered} questions answered
                    </Text>
                    <Text style={styles.overviewStatDot}>•</Text>
                    <Text style={styles.overviewStatPill}>
                      {learningSummary.quizAttempts} practice sessions
                    </Text>
                  </View>

                  {learningSummary.recentlyPracticed.length > 0 ? (
                    <View style={styles.overviewCategoryGroup}>
                      <Text style={styles.overviewCategoryLabel}>Recently practiced</Text>
                      {learningSummary.recentlyPracticed.slice(0, 3).map((item) => (
                        <Text key={item.topicId} style={styles.overviewItemBullet}>
                          • {item.title}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  {learningSummary.buildingConfidence.length > 0 ? (
                    <View style={styles.overviewCategoryGroup}>
                      <Text style={styles.overviewCategoryLabel}>Building confidence</Text>
                      {learningSummary.buildingConfidence.slice(0, 3).map((item) => (
                        <Text key={item.topicId} style={styles.overviewItemBullet}>
                          • {item.title}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  {learningSummary.notYetExplored.length > 0 ? (
                    <View style={styles.overviewCategoryGroup}>
                      <Text style={styles.overviewCategoryLabel}>Not yet explored</Text>
                      {learningSummary.notYetExplored.slice(0, 3).map((item) => (
                        <Text key={item.topicId} style={styles.overviewItemBullet}>
                          • {item.title}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  {activeChildRecord ? (
                    <TouchableOpacity
                      onPress={() => router.push(`/parent/family/${activeChildRecord.profile.id}/insights`)}
                      style={styles.fullInsightsButton}
                      accessibilityRole="button"
                      accessibilityLabel="View all learning insights"
                    >
                      <Text style={styles.fullInsightsButtonText}>View all learning insights →</Text>
                    </TouchableOpacity>
                  ) : null}
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

              {/* Recent Activity */}
              {recentActivity.length > 0 ? (
                <View style={styles.section}>
                  <RecentActivity activities={recentActivity} />
                </View>
              ) : null}

              {/* Footer actions */}
              <View style={styles.footer}>
                <PrimaryButton
                  label="Family Dashboard →"
                  variant="secondary"
                  onPress={() => router.push('/parent/family')}
                  accessibilityLabel="Family Dashboard"
                  accessibilityHint="Navigates to family overview"
                />
                <PrimaryButton
                  label="Parent Settings →"
                  variant="tertiary"
                  onPress={() => router.push('/parent/settings')}
                  accessibilityLabel="Parent Settings"
                  accessibilityHint="Navigates to parent settings"
                />
                <PrimaryButton
                  label="Data & Privacy →"
                  variant="tertiary"
                  onPress={() => router.push('/parent/data')}
                  accessibilityLabel="Data and Privacy"
                  accessibilityHint="Navigates to data and privacy"
                />
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
            /* Empty State */
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Learning History</Text>
                <Text style={styles.emptyMessage}>
                  {childName
                    ? `Learning progress for ${childName} will appear here after their first quiz.`
                    : 'Learning progress will appear here after the first quiz.'}
                </Text>
                <Text style={styles.emptySubmessage}>
                  Complete a quiz to start building learning insights.
                </Text>
              </View>

              <View style={styles.footer}>
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
  childHeaderName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },
  screenHeading: {
    fontSize: 28,
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
    marginBottom: spacing.md,
  },
  headerActions: {
    width: '100%',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  headerButton: {
    minHeight: 44,
  },
  metricsCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
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
    paddingHorizontal: spacing.xs,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  focusCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
    padding: spacing.xl,
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
    elevation: 1,
  },
  focusEyebrow: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  focusTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  focusDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
  footer: {
    width: '100%',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: spacing.xxl,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
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
  emptyMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  emptySubmessage: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  learningOverviewCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
    padding: spacing.xl,
    gap: spacing.md,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  overviewInsightsLink: {
    minHeight: 44,
    justifyContent: 'center',
  },
  overviewInsightsLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  overviewStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  overviewStatPill: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  overviewStatDot: {
    fontSize: 13,
    color: colors.border,
  },
  overviewCategoryGroup: {
    gap: 4,
  },
  overviewCategoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  overviewItemBullet: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    paddingLeft: spacing.xs,
  },
  fullInsightsButton: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fullInsightsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
});