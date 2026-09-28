import { useDocumentTitle } from "../../lib/utils/useDocumentTitle";
import React, { useState, useEffect } from 'react';
import { trackEvent } from '../../lib/analytics';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
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
import {
  getLearningPlan,
  updateLearningIntention,
} from '../../features/plans/planRepository';
import {
  LearningPlan,
  LEARNING_INTENTIONS,
  LearningIntention,
} from '../../features/plans/planTypes';

export default function ParentDashboardScreen() {
  useEffect(() => {
    trackEvent('parent_dashboard_opened');
    trackEvent('family_dashboard_opened');
  }, []);
  useDocumentTitle("Tutr Kidz — Parent Dashboard");

  const { isLocked, checking, handleUnlockSuccess, handleUnlockCancel } = useParentAccess();
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [activeChildRecord, setActiveChildRecord] = useState<ChildRecord | null>(null);
  const [hasMultipleChildren, setHasMultipleChildren] = useState<boolean>(false);
  const [todayQuestions, setTodayQuestions] = useState<number>(0);
  const [lockEnabled, setLockEnabled] = useState<boolean>(false);
  const [dailyFocus, setDailyFocus] = useState<DailyLearningRecommendation | null>(null);
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [intentionModalVisible, setIntentionModalVisible] = useState<boolean>(false);

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

        const [dashboardData, progress, isLockActive, rec, currentPlan] = await Promise.all([
          fetchParentDashboardData(activeId),
          getProgress(activeId),
          isParentLockEnabled(),
          fetchDailyRecommendation(activeId),
          activeId ? getLearningPlan(activeId) : Promise.resolve(null),
        ]);

        if (isMounted) {
          setData(dashboardData);
          setTodayQuestions(getTodayQuestionsAnswered(progress));
          setLockEnabled(isLockActive);
          setDailyFocus(rec);
          setLearningPlan(currentPlan);
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

  const handleSaveIntention = async (intention: LearningIntention) => {
    if (!activeChildRecord?.profile?.id) return;
    const updated = await updateLearningIntention(activeChildRecord.profile.id, intention);
    setLearningPlan(updated);
    setIntentionModalVisible(false);
    // Refresh dashboard data with new intention-aware guidance
    const freshDashboard = await fetchParentDashboardData(activeChildRecord.profile.id);
    setData(freshDashboard);
  };

  if (checking || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent} style={{ marginBottom: spacing.md }} />
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
    continuity,
    topicHistory,
  } = data;

  const childName = getChildDisplayName(activeChildRecord);
  const childLevel = activeChildRecord?.profile?.level;
  const levelConfig = childLevel ? getLevelById(childLevel) : null;
  const levelTitle = levelConfig?.title ?? (childLevel || 'None');
  const isToddler = childLevel === 'toddler';

  const formatDaysAgo = (days: number | null) => {
    if (days === null) return 'Not yet active';
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const handleManualLock = () => {
    lockParent();
    router.replace('/');
  };

  // Topics worth revisiting
  const revisitTopics = topicHistory
    ? topicHistory.filter(
        (t) => t.recentState === 'revisit-suggested' || (t.attempts >= 1 && t.mastery === 'developing')
      )
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ParentLockChallengeModal
        visible={isLocked}
        onSuccess={handleUnlockSuccess}
        onCancel={handleUnlockCancel}
      />

      {/* Learning Intention Selection Modal (Phase 19) */}
      <Modal
        visible={intentionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIntentionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard} accessible={true}  accessibilityLabel="Choose a gentle learning intention">
            <Text style={styles.modalTitle}>Gentle Learning Intention</Text>
            <Text style={styles.modalSubtitle}>
              Select a calm intention for {childName || 'your learner'}. There are no deadlines or score targets.
            </Text>

            <View style={styles.intentionList}>
              {LEARNING_INTENTIONS.map((intention) => {
                const isSelected = learningPlan?.intention === intention;
                return (
                  <Pressable
                    key={intention}
                    onPress={() => handleSaveIntention(intention)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={intention + (isSelected ? ', currently selected' : '')}
                    style={({ pressed }) => [
                      styles.intentionOption,
                      isSelected && styles.intentionOptionSelected,
                      pressed && styles.intentionOptionPressed,
                    ]}
                  >
                    <Text style={[styles.intentionOptionText, isSelected && styles.intentionOptionTextSelected]}>
                      {intention}
                    </Text>
                    {isSelected ? <Text style={styles.intentionCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>

            <PrimaryButton
              label="Close"
              variant="tertiary"
              onPress={() => setIntentionModalVisible(false)}
              accessibilityLabel="Close intention dialog"
              style={{ minHeight: 48 }}
            />
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>Tutr Kidz</Text>
            <Text style={styles.screenHeading}>Family Home</Text>
            <Text style={styles.subtitle}>Calm, private overview of your family's learning.</Text>
          </View>

          {/* 1. ACTIVE LEARNER HIERARCHY */}
          <View style={styles.activeLearnerCard} accessible={true} accessibilityRole="summary" accessibilityLabel="Active Learner Overview">
            <View style={styles.learnerHeaderRow}>
              <View style={styles.learnerInfo}>
                <Text style={styles.learnerLabel}>Active Learner</Text>
                <Text style={styles.learnerName}>{childName || 'No learner active'}</Text>
                <Text style={styles.learnerLevel}>{levelTitle}</Text>
              </View>
              <Pressable
                onPress={() => router.push('/parent/children')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Switch learner"
                accessibilityHint="Opens learner selection to choose who is learning"
                style={({ pressed }) => [
                  styles.switchLearnerBtn,
                  pressed && styles.switchLearnerBtnPressed,
                ]}
              >
                <Text style={styles.switchLearnerBtnText}>Switch Learner →</Text>
              </Pressable>
            </View>

            {/* Gentle Learning Intention Card */}
            <View style={styles.intentionCard}>
              <View style={styles.intentionHeaderRow}>
                <Text style={styles.intentionEyebrow}>Gentle Learning Intention</Text>
                <Pressable
                  onPress={() => setIntentionModalVisible(true)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Change learning intention"
                  style={({ pressed }) => [
                    styles.changeIntentionBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.changeIntentionBtnText}>Change Intention</Text>
                </Pressable>
              </View>
              <Text style={styles.intentionCurrent}>
                "{learningPlan?.intention || 'Keep learning naturally'}"
              </Text>
              <Text style={styles.intentionHint}>
                A gentle family intention without streaks, deadlines, or pressure.
              </Text>
            </View>
          </View>

          {hasData ? (
            <View style={styles.mainContent}>
              {/* 2. LEARNING RECENTLY (Phase 18 & 19 Continuity & Plan-Aware Guidance) */}
              {continuity ? (
                <View style={styles.continuityCard} accessible={true} accessibilityRole="summary" accessibilityLabel="Learning recently">
                  <Text style={styles.continuityEyebrow}>Learning Recently</Text>
                  <View style={styles.continuityRow}>
                    <View style={styles.continuityStat}>
                      <Text style={styles.continuityStatLabel}>Last practice</Text>
                      <Text style={styles.continuityStatValue}>
                        {formatDaysAgo(continuity.daysSinceLastPractice)}
                      </Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.continuityStat}>
                      <Text style={styles.continuityStatLabel}>Past 7 days</Text>
                      <Text style={styles.continuityStatValue}>
                        {continuity.recentWindow.last7DaysQuestions} questions
                      </Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.continuityStat}>
                      <Text style={styles.continuityStatLabel}>Sessions</Text>
                      <Text style={styles.continuityStatValue}>
                        {continuity.recentWindow.last7DaysSessions} sessions
                      </Text>
                    </View>
                  </View>

                  <View style={styles.continuityMessageBlock}>
                    <Text style={styles.continuityTrendText}>
                      {continuity.guidance.title}
                    </Text>
                    <Text style={styles.continuityGuidanceText}>
                      {continuity.guidance.message}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* 3. CONTINUE EXPLORING (Daily Focus / Next Natural Topic) */}
              {dailyFocus ? (
                <View style={styles.focusCard} accessible={true} accessibilityRole="summary" accessibilityLabel="Continue exploring recommendation">
                  <Text style={styles.focusEyebrow}>Continue Exploring</Text>
                  <Text style={styles.focusTitle}>{dailyFocus.title}</Text>
                  <Text style={styles.focusDescription}>{dailyFocus.description}</Text>
                </View>
              ) : null}

              {/* 4. TOPICS WORTH REVISITING */}
              {revisitTopics.length > 0 ? (
                <View style={styles.section} accessible={true} accessibilityRole="summary" accessibilityLabel="Topics worth revisiting">
                  <Text style={styles.sectionHeading}>Topics Worth Revisiting</Text>
                  <Text style={styles.sectionSubheading}>
                    Concepts practiced earlier that can be gently revisited whenever your learner is curious.
                  </Text>
                  <View style={styles.practiceList}>
                    {revisitTopics.map((topic) => (
                      <View key={topic.topicId} style={styles.revisitCard}>
                        <View style={styles.revisitHeaderRow}>
                          <Text style={styles.revisitTitle}>{topic.title}</Text>
                          <Text style={styles.revisitBadge}>Gentle revisit</Text>
                        </View>
                        <Text style={styles.revisitDescription}>
                          {topic.isToddler
                            ? 'Ready to explore again when your toddler is curious.'
                            : 'A gentle revisit can help keep this concept fresh and familiar.'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Learning Progress Summary Link */}
              {activeChildRecord ? (
                <View style={styles.insightsCard}>
                  <Text style={styles.insightsCardTitle}>Detailed Learner Insights</Text>
                  <Text style={styles.insightsCardDescription}>
                    View chronological learning history, mastery breakdown, and practice patterns for {childName}.
                  </Text>
                  <PrimaryButton
                    label="View Full Learning Insights →"
                    variant="secondary"
                    onPress={() => router.push(`/parent/family/${activeChildRecord.profile.id}/insights`)}
                    style={{ minHeight: 48 }}
                    accessibilityLabel={`View learning insights for ${childName}`}
                  />
                </View>
              ) : null}

              {/* 5. FAMILY NAVIGATION */}
              <View style={styles.navigationSection}>
                <Text style={styles.sectionHeading}>Family Controls</Text>
                <View style={styles.headerActions}>
                  <PrimaryButton
                    label="All Learners Overview →"
                    variant="secondary"
                    onPress={() => router.push('/parent/family')}
                    style={styles.headerButton}
                    accessibilityLabel="Family Dashboard"
                    accessibilityHint="Navigates to family overview across all learners"
                  />
                  <PrimaryButton
                    label="Share Feedback →"
                    variant="tertiary"
                    onPress={() => router.push('/parent/feedback')}
                    style={styles.headerButton}
                    accessibilityLabel="Share feedback"
                    accessibilityHint="Navigates to parent feedback form"
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
            </View>
          ) : (
            /* Graceful Empty State */
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  {childName ? `Welcome, ${childName}!` : 'Welcome to Tutr Kidz'}
                </Text>
                <Text style={styles.emptyMessage}>
                  {childName
                    ? `Learning progress for ${childName} will appear here after their first exploration.`
                    : 'Learning progress will appear here after the first exploration.'}
                </Text>
                <Text style={styles.emptySubmessage}>
                  Start an activity or quiz to begin building your child's learning journey.
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
                <PrimaryButton
                  label="Family Overview →"
                  variant="tertiary"
                  onPress={() => router.push('/parent/family')}
                  accessibilityLabel="Family overview"
                  accessibilityHint="Navigates to family overview"
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
  },
  activeLearnerCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.lg,
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
    elevation: 1,
  },
  learnerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  learnerInfo: {
    gap: 2,
  },
  learnerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  learnerName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  learnerLevel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  switchLearnerBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: layout.borderRadius.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  switchLearnerBtnPressed: {
    backgroundColor: colors.cardPressed,
  },
  switchLearnerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  intentionCard: {
    backgroundColor: colors.background,
    borderRadius: layout.borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  intentionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  intentionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  changeIntentionBtn: {
    paddingVertical: 2,
  },
  changeIntentionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  intentionCurrent: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontStyle: 'italic',
  },
  intentionHint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  mainContent: {
    gap: spacing.xl,
  },
  continuityCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
    elevation: 1,
  },
  continuityEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  continuityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  continuityStat: {
    flex: 1,
    alignItems: 'center',
  },
  continuityStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  continuityStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  continuityMessageBlock: {
    marginTop: spacing.md,
    gap: 4,
  },
  continuityTrendText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  continuityGuidanceText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  focusCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  focusEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  focusDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionSubheading: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  practiceList: {
    gap: spacing.sm,
  },
  revisitCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  revisitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revisitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  revisitBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  revisitDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  insightsCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  insightsCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  insightsCardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  navigationSection: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  headerActions: {
    width: '100%',
    gap: spacing.sm,
  },
  headerButton: {
    minHeight: 48,
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
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  emptySubmessage: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    width: '100%',
    gap: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: layout.maxWidth,
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  intentionList: {
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  intentionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    minHeight: 52,
  },
  intentionOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: '#FAF9FF',
  },
  intentionOptionPressed: {
    backgroundColor: colors.cardPressed,
  },
  intentionOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  intentionOptionTextSelected: {
    color: colors.accent,
    fontWeight: '700',
  },
  intentionCheck: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.accent,
  },
});
