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
import { ChildRecord } from '../../../../features/family/familyTypes';
import { getLevelById } from '../../../../constants/levels';
import {
  fetchChildLearningSummary,
  fetchChildTopicInsights,
} from '../../../../features/insights/insightRepository';
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
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!childId) return;
    try {
      const familyState = await getFamilyState();
      const current = familyState.children[childId];
      if (current) {
        setChildRecord(current);
        const [sum, topics] = await Promise.all([
          fetchChildLearningSummary(childId),
          fetchChildTopicInsights(childId),
        ]);
        setSummary(sum);
        setTopicInsights(topics);
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

  if (checking || loading || !childRecord) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.loadingText}>Loading learning insights...</Text>
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
});
