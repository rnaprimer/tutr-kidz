import { useDocumentTitle } from "../../../../lib/utils/useDocumentTitle";
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { colors, spacing, layout } from '../../../../constants/colors';
import { PrimaryButton } from '../../../../components/ui/PrimaryButton';
import { ParentLockChallengeModal } from '../../../../components/settings/ParentLockChallengeModal';
import { useParentAccess } from '../../../../features/settings/useParentAccess';
import { getFamilyState } from '../../../../features/family/familyRepository';
import { getProgress } from '../../../../features/progress/progressStorage';
import { getChronologicalLearningHistory } from '../../../../features/plans/planUtils';
import { ChronologicalHistory } from '../../../../features/plans/planTypes';
import { ChildRecord } from '../../../../features/family/familyTypes';
import { getLevelById } from '../../../../constants/levels';
import {
  fetchChildLearningSummary,
  fetchChildTopicInsights,
  fetchChildLearningContinuity,
  fetchChildTopicHistory,
} from '../../../../features/insights/insightRepository';
import {
  LearningContinuity,
  TopicHistoryItem,
} from '../../../../features/insights/continuityTypes';
import { trackEvent } from '../../../../lib/analytics';
import {
  LearningSummary,
  TopicInsight,
  MasteryLevel,
} from '../../../../features/insights/insightTypes';

export default function ChildLearningInsightsScreen() {
  useDocumentTitle("Tutr Kidz — Learning Insights");

  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { isLocked, checking, handleUnlockSuccess, handleUnlockCancel } = useParentAccess();

  const [childRecord, setChildRecord] = useState<ChildRecord | null>(null);
  const [summary, setSummary] = useState<LearningSummary | null>(null);
  const [topicInsights, setTopicInsights] = useState<TopicInsight[]>([]);
  const [continuity, setContinuity] = useState<LearningContinuity | null>(null);
  const [topicHistory, setTopicHistory] = useState<TopicHistoryItem[]>([]);
  const [chronoHistory, setChronoHistory] = useState<ChronologicalHistory | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!childId) return;
    try {
      const familyState = await getFamilyState();
      const current = familyState.children[childId];
      if (current) {
        setChildRecord(current);
        const [sum, topics, cont, hist, prog] = await Promise.all([
          fetchChildLearningSummary(childId),
          fetchChildTopicInsights(childId),
          fetchChildLearningContinuity(childId),
          fetchChildTopicHistory(childId, current.profile.level),
          getProgress(childId),
        ]);
        const chrono = getChronologicalLearningHistory(prog, current.profile.level);
        setSummary(sum);
        setTopicInsights(topics);
        setContinuity(cont);
        setTopicHistory(hist);
        setChronoHistory(chrono);
        trackEvent('learning_insights_opened');
        trackEvent('learning_history_opened');
      }
    } catch {
      // offline fallback handled gracefully
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (checking || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent} style={{ marginBottom: spacing.md }} />
          <Text style={styles.loadingText}>Loading learning insights...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!childRecord) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { paddingHorizontal: spacing.xl, justifyContent: 'center', flex: 1, alignItems: 'center' }]}>
          <Text style={styles.brandTitle}>Tutr Kidz</Text>
          <Text style={[styles.heading, { fontSize: 24, marginVertical: spacing.md }]}>
            We couldn't find this learner.
          </Text>
          <Text style={[styles.subtitle, { marginBottom: spacing.xl, textAlign: 'center' }]}>
            This learner profile may have been removed or the link is invalid.
          </Text>
          <PrimaryButton
            label="Return to Family"
            onPress={() => router.replace('/parent/family')}
            style={{ width: '100%', maxWidth: 280 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const childName = childRecord.profile.name;
  const levelConfig = getLevelById(childRecord.profile.level);
  const levelTitle = levelConfig?.title ?? childRecord.profile.level;
  const isToddler = childRecord.profile.level === 'toddler';

  const formatLastPlayed = (iso?: string) => {
    if (!iso) return 'Not yet practiced';
    try {
      const date = new Date(iso);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
      if (isToday) return 'Today';

      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();
      if (isYesterday) return 'Yesterday';

      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const getMasteryBadge = (mastery: MasteryLevel) => {
    switch (mastery) {
      case 'well-practiced':
        return { label: 'Well-practiced', bg: '#DCFCE7', text: '#15803D' };
      case 'comfortable':
        return { label: 'Comfortable', bg: '#E0E7FF', text: '#3730A3' };
      case 'developing':
        return { label: 'Developing', bg: '#FEF3C7', text: '#92400E' };
      case 'emerging':
      default:
        return { label: 'Emerging', bg: '#F3F4F6', text: '#6B7280' };
    }
  };

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
            <Text style={styles.heading}>Learning insights</Text>
            <View style={styles.childMetaRow}>
              <Text style={styles.childNameText}>{childName}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{levelTitle}</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Understanding what {childName} is exploring and practicing.
            </Text>
          </View>

          {/* Metric Overview Card */}
          {summary ? (
            <View style={styles.metricsCard}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Topics Explored</Text>
                <Text style={styles.metricValue}>
                  {summary.topicsExplored} / {summary.totalTopicsInLevel}
                </Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Questions</Text>
                <Text style={styles.metricValue}>{summary.questionsAnswered}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Sessions</Text>
                <Text style={styles.metricValue}>{summary.quizAttempts}</Text>
              </View>
            </View>
          ) : null}

          {/* Adaptive Practice Guidance */}
          {summary?.adaptiveGuidance ? (
            <View style={styles.guidanceCard}>
              <Text style={styles.guidanceEyebrow}>Adaptive Practice Guidance</Text>
              <Text style={styles.guidanceTitle}>
                {summary.adaptiveGuidance.recommendationTitle}
              </Text>
              <Text style={styles.guidanceMessage}>
                {summary.adaptiveGuidance.adaptiveMessage}
              </Text>
            </View>
          ) : null}

          {/* Learning Recently (Phase 18) */}
          {continuity ? (
            <View style={styles.continuityCard}>
              <Text style={styles.continuityEyebrow}>Learning recently</Text>
              <View style={styles.continuityRow}>
                <View style={styles.continuityStat}>
                  <Text style={styles.continuityStatLabel}>Last practice</Text>
                  <Text style={styles.continuityStatValue}>
                    {continuity.daysSinceLastPractice === null
                      ? 'Not yet started'
                      : continuity.daysSinceLastPractice === 0
                      ? 'Today'
                      : continuity.daysSinceLastPractice === 1
                      ? 'Yesterday'
                      : `${continuity.daysSinceLastPractice} days ago`}
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
                  {continuity.trendDescription}
                </Text>
                <Text style={styles.continuityGuidanceText}>
                  {continuity.guidance.message}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Learning Pattern (Phase 18) */}
          {continuity ? (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Learning Pattern</Text>
              <View style={styles.patternCard}>
                <View style={styles.patternHeaderRow}>
                  <Text style={styles.patternStatusPill}>{continuity.stateLabel}</Text>
                  <Text style={styles.patternFrequencyText}>
                    {continuity.recentWindow.last7DaysActiveDays} active {continuity.recentWindow.last7DaysActiveDays === 1 ? 'day' : 'days'} this week
                  </Text>
                </View>
                <Text style={styles.patternDescription}>
                  {continuity.trendDescription}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Topics to Revisit (Phase 18) */}
          {(() => {
            const revisitTopics = topicHistory.filter(
              (t) => t.recentState === 'revisit-suggested' || (t.attempts >= 1 && t.mastery === 'developing')
            );
            if (revisitTopics.length === 0) return null;
            return (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Topics to Revisit</Text>
                <View style={styles.revisitList}>
                  {revisitTopics.map((t) => (
                    <View key={t.topicId} style={styles.revisitCard}>
                      <View style={styles.revisitHeaderRow}>
                        <Text style={styles.revisitTitle}>{t.title}</Text>
                        <Text style={styles.revisitBadge}>Gentle revisit</Text>
                      </View>
                      <Text style={styles.revisitMessage}>
                        {t.isToddler
                          ? 'Ready to explore again when your toddler is curious.'
                          : 'A gentle revisit may help keep this concept familiar.'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}

          {/* Recently Explored (Phase 18) */}
          {(() => {
            const exploredTopics = topicHistory.filter(
              (t) => t.recentState === 'recently-explored' || t.recentState === 'familiar'
            );
            if (exploredTopics.length === 0) return null;
            return (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Recently Explored</Text>
                <View style={styles.exploredList}>
                  {exploredTopics.map((t) => (
                    <View key={t.topicId} style={styles.exploredCard}>
                      <Text style={styles.exploredTitle}>{t.title}</Text>
                      <Text style={styles.exploredSummary}>{t.displaySummary}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}

          {/* Chronological Learning History (Phase 19) */}
          <View style={styles.section} accessible={true} accessibilityRole="summary" accessibilityLabel="Chronological Learning History">
            <Text style={styles.sectionHeading}>Learning History</Text>
            {chronoHistory && chronoHistory.totalEntries > 0 ? (
              <View style={styles.chronoContainer}>
                {chronoHistory.recently.length > 0 ? (
                  <View style={styles.chronoGroup}>
                    <Text style={styles.chronoSubheading}>Recently</Text>
                    {chronoHistory.recently.map((entry, idx) => (
                      <View key={'recent-' + entry.topicId + '-' + idx} style={styles.historyCard}>
                        <View style={styles.historyCardHeader}>
                          <Text style={styles.historyCardTitle}>{entry.topicTitle}</Text>
                          <Text style={styles.historyCardDate}>{entry.dateFormatted}</Text>
                        </View>
                        <View style={styles.historyCardDetails}>
                          <Text style={styles.historyCardType}>{entry.activityType}</Text>
                          {entry.questionsAnswered > 0 ? (
                            <>
                              <Text style={styles.historyCardDot}>•</Text>
                              <Text style={styles.historyCardQuestions}>
                                {entry.questionsAnswered} {entry.questionsAnswered === 1 ? 'question' : 'questions'}
                              </Text>
                            </>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}

                {chronoHistory.earlier.length > 0 ? (
                  <View style={styles.chronoGroup}>
                    <Text style={styles.chronoSubheading}>Earlier</Text>
                    {chronoHistory.earlier.map((entry, idx) => (
                      <View key={'earlier-' + entry.topicId + '-' + idx} style={styles.historyCard}>
                        <View style={styles.historyCardHeader}>
                          <Text style={styles.historyCardTitle}>{entry.topicTitle}</Text>
                          <Text style={styles.historyCardDate}>{entry.dateFormatted}</Text>
                        </View>
                        <View style={styles.historyCardDetails}>
                          <Text style={styles.historyCardType}>{entry.activityType}</Text>
                          {entry.questionsAnswered > 0 ? (
                            <>
                              <Text style={styles.historyCardDot}>•</Text>
                              <Text style={styles.historyCardQuestions}>
                                {entry.questionsAnswered} {entry.questionsAnswered === 1 ? 'question' : 'questions'}
                              </Text>
                            </>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.emptyHistoryCard}>
                <Text style={styles.emptyHistoryText}>
                  Learning history will appear here as your child explores.
                </Text>
              </View>
            )}
          </View>

          {/* Detailed Topic List */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Topic Breakdown</Text>
            <View style={styles.topicList}>
              {topicInsights.map((t) => {
                const badge = getMasteryBadge(t.mastery);
                const hasPractice = t.attempts >= 1;

                return (
                  <View key={t.topicId} style={styles.topicCard}>
                    <View style={styles.topicHeaderRow}>
                      <Text style={styles.topicTitle}>{t.title}</Text>
                      <View style={[styles.badgeContainer, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.text }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.topicDetailsRow}>
                      {isToddler ? (
                        <Text style={styles.topicDetailText}>
                          {hasPractice ? 'Activity explored' : 'Not yet explored'}
                        </Text>
                      ) : (
                        <>
                          <Text style={styles.topicDetailText}>
                            {t.questionsAnswered} {t.questionsAnswered === 1 ? 'question' : 'questions'}
                          </Text>
                          {t.questionsAnswered > 0 ? (
                            <>
                              <Text style={styles.topicDetailDot}>•</Text>
                              <Text style={styles.topicDetailText}>{t.accuracy}% accuracy</Text>
                            </>
                          ) : null}
                        </>
                      )}
                      <Text style={styles.topicDetailDot}>•</Text>
                      <Text style={styles.topicDetailText}>
                        {formatLastPlayed(t.lastPlayedAt)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Footer Back */}
          <View style={styles.footer}>
            <PrimaryButton
              label="Back to Family Dashboard"
              variant="tertiary"
              onPress={() => router.back()}
              accessibilityLabel="Back to family dashboard"
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
    gap: spacing.md,
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
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  childMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  childNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  levelBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: layout.borderRadius.sm,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3730A3',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  metricsCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
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
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  guidanceCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: 4,
  },
  guidanceEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guidanceTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  guidanceMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  chronoContainer: {
    gap: spacing.lg,
  },
  chronoGroup: {
    gap: spacing.sm,
  },
  chronoSubheading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  historyCardDate: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
  },
  historyCardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  historyCardType: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  historyCardDot: {
    fontSize: 13,
    color: colors.border,
  },
  historyCardQuestions: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyHistoryCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  topicList: {
    gap: spacing.sm,
  },
  topicCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  topicHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  badgeContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  topicDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  topicDetailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  topicDetailDot: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  continuityCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
    elevation: 1,
  },
  continuityEyebrow: {
    fontSize: 14,
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
  continuityMessageBlock: {
    marginTop: spacing.md,
    gap: 4,
  },
  continuityTrendText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  continuityGuidanceText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  patternCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
    elevation: 1,
  },
  patternHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  patternStatusPill: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  patternFrequencyText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  patternDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  revisitList: {
    gap: spacing.sm,
  },
  revisitCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: spacing.md,
  },
  revisitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  revisitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  revisitBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  revisitMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  exploredList: {
    gap: spacing.sm,
  },
  exploredCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  exploredTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  exploredSummary: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
