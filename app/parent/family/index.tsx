import { useDocumentTitle } from "../../../lib/utils/useDocumentTitle";
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors, layout, spacing } from '../../../constants/colors';
import {
  fetchFamilyDashboardData,
} from '../../../features/familyInsights/familyInsightRepository';
import { FamilyDashboardData } from '../../../features/familyInsights/familyInsightTypes';
import { FamilyChildCard } from '../../../components/family/FamilyChildCard';
import { FamilyRecentActivity } from '../../../components/family/FamilyRecentActivity';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { useParentAccess } from '../../../features/settings/useParentAccess';
import { ParentLockChallengeModal } from '../../../components/settings/ParentLockChallengeModal';

export default function FamilyDashboardScreen() {
  useDocumentTitle("Tutr Kidz — Family Dashboard");

  const { isLocked, checking, handleUnlockSuccess, handleUnlockCancel } = useParentAccess();
  const [data, setData] = useState<FamilyDashboardData | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      fetchFamilyDashboardData().then((res) => {
        if (isMounted) setData(res);
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  if (checking || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent} style={{ marginBottom: spacing.md }} />
          <Text style={styles.loadingText}>Loading family insights...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { summary, childSummaries, recentActivity, hasChildren } = data;

  const handleViewChildDetail = (childId: string) => {
    router.push({
      pathname: '/parent/family/[childId]',
      params: { childId },
    });
  };

  const handleAddLearner = () => {
    router.push('/profile');
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
            <Text style={styles.heading}>Your Family's Learning</Text>
            <Text style={styles.subtitle}>
              An overview of everyone's learning journey.
            </Text>

            <View style={styles.headerActions}>
              <PrimaryButton
                label="Manage Learners →"
                variant="secondary"
                onPress={() => router.push('/parent/children')}
                style={styles.headerButton}
                accessibilityLabel="Manage learners"
                accessibilityHint="Navigates to learner management and switching"
              />
              <PrimaryButton
                label="Family Settings →"
                variant="tertiary"
                onPress={() => router.push('/parent/family/settings')}
                style={styles.headerButton}
                accessibilityLabel="Family settings"
                accessibilityHint="Navigates to family configuration and defaults"
              />
            </View>
          </View>

          {hasChildren ? (
            <View style={styles.mainContent}>
              {/* Family Summary Metrics */}
              <View style={styles.summaryCard}>
                <View style={styles.statBlock}>
                  <Text style={styles.statValue}>{summary.childCount}</Text>
                  <Text style={styles.statLabel}>
                    {summary.childCount === 1 ? 'Learner' : 'Learners'}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statBlock}>
                  <Text style={styles.statValue}>{summary.totalQuestionsAnswered}</Text>
                  <Text style={styles.statLabel}>Questions</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statBlock}>
                  <Text style={styles.statValue}>{summary.totalQuizzesCompleted}</Text>
                  <Text style={styles.statLabel}>Quizzes</Text>
                </View>
              </View>

              {/* Individual Learner Cards */}
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Learners</Text>
                <View style={styles.childList}>
                  {childSummaries.map((child) => (
                    <FamilyChildCard
                      key={child.childId}
                      summary={child}
                      onViewProgress={() => handleViewChildDetail(child.childId)}
                    />
                  ))}
                </View>
              </View>

              {/* Recent Family Activity */}
              {recentActivity.length > 0 ? (
                <View style={styles.section}>
                  <FamilyRecentActivity activities={recentActivity} />
                </View>
              ) : null}

              {/* Footer Actions */}
              <View style={styles.footer}>
                <PrimaryButton
                  label="+ Add Learner"
                  variant="secondary"
                  onPress={handleAddLearner}
                  accessibilityLabel="Add learner"
                  accessibilityHint="Navigates to create a new learner profile"
                />
                <PrimaryButton
                  label="Back"
                  variant="tertiary"
                  onPress={() => router.back()}
                  accessibilityLabel="Back"
                  accessibilityHint="Returns to parent dashboard"
                />
              </View>
            </View>
          ) : (
            /* Empty State */
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Learners Added Yet</Text>
                <Text style={styles.emptyMessage}>
                  Add a learner to start tracking learning progress.
                </Text>
              </View>

              <View style={styles.footer}>
                <PrimaryButton
                  label="+ Add Learner"
                  variant="primary"
                  onPress={handleAddLearner}
                  accessibilityLabel="Add learner"
                  accessibilityHint="Navigates to create a new learner profile"
                />
                <PrimaryButton
                  label="Back"
                  variant="tertiary"
                  onPress={() => router.back()}
                  accessibilityLabel="Back"
                  accessibilityHint="Returns to parent dashboard"
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
    marginBottom: spacing.md,
  },
  headerActions: {
    width: '100%',
    marginTop: spacing.xs,
  },
  headerButton: {
    minHeight: 48,
  },
  mainContent: {
    gap: spacing.xxl,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
    elevation: 1,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
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
  childList: {
    gap: spacing.md,
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
    borderRadius: layout.borderRadius.lg,
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
