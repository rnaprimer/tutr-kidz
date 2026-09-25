import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';
import { getLevelById } from '../../constants/levels';
import { FamilyChildSummary } from '../../features/familyInsights/familyInsightTypes';

interface FamilyChildCardProps {
  summary: FamilyChildSummary;
  onViewProgress: () => void;
}

export const FamilyChildCard: React.FC<FamilyChildCardProps> = ({
  summary,
  onViewProgress,
}) => {
  const levelConfig = getLevelById(summary.level);
  const levelTitle = levelConfig?.title ?? summary.level;
  const lastTopic = summary.recentActivity.length > 0 ? summary.recentActivity[0].title : null;

  return (
    <View
      style={styles.card}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`${summary.name}, ${levelTitle}. ${summary.questionsAnswered} questions answered, ${summary.accuracy}% accuracy.`}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{summary.name}</Text>
        <Text style={styles.levelBadge}>{levelTitle}</Text>
      </View>

      {/* Metrics */}
      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{summary.questionsAnswered}</Text>
          <Text style={styles.statLabel}>questions answered</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{summary.accuracy}%</Text>
          <Text style={styles.statLabel}>accuracy</Text>
        </View>
      </View>

      {/* Last practiced */}
      {lastTopic ? (
        <View style={styles.lastPracticedRow}>
          <Text style={styles.lastPracticedLabel}>Last practiced</Text>
          <Text style={styles.lastPracticedTopic}>{lastTopic}</Text>
        </View>
      ) : (
        <View style={styles.lastPracticedRow}>
          <Text style={styles.lastPracticedLabel}>Status</Text>
          <Text style={styles.lastPracticedTopic}>Ready for first quiz</Text>
        </View>
      )}

      {/* Action */}
      <Pressable
        onPress={onViewProgress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`View ${summary.name}'s progress`}
        accessibilityHint={`Opens detailed learning progress for ${summary.name}`}
        style={({ pressed }) => [
          styles.actionButton,
          pressed && styles.actionButtonPressed,
        ]}
      >
        <Text style={styles.actionButtonText}>
          View {summary.name}'s progress →
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  levelBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  statBlock: {
    flex: 1,
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
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  lastPracticedRow: {
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: layout.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastPracticedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  lastPracticedTopic: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  actionButton: {
    minHeight: 56, // Accessible touch target
    backgroundColor: colors.background,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  actionButtonPressed: {
    backgroundColor: colors.cardPressed,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
});
