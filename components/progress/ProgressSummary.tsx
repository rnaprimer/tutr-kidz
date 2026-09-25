import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';

interface ProgressSummaryProps {
  title?: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy?: number;
  emptyMessage?: string;
  onViewAll?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  title = 'Your progress',
  questionsAnswered,
  correctAnswers,
  accuracy,
  emptyMessage = 'Start learning to see your progress here.',
  onViewAll,
  style,
}) => {
  const hasProgress = questionsAnswered > 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {hasProgress && onViewAll ? (
          <Pressable
            onPress={onViewAll}
            accessibilityRole="button"
            accessibilityLabel="View full progress"
            hitSlop={12}
          >
            <Text style={styles.viewAllText}>View Progress →</Text>
          </Pressable>
        ) : null}
      </View>

      {hasProgress ? (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{questionsAnswered}</Text>
            <Text style={styles.statLabel}>
              question{questionsAnswered === 1 ? '' : 's'} answered
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {accuracy !== undefined ? `${accuracy}%` : correctAnswers}
            </Text>
            <Text style={styles.statLabel}>
              {accuracy !== undefined ? 'accuracy' : 'correct'}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
