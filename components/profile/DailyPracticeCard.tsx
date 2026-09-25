import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';

interface DailyPracticeCardProps {
  questionsAnswered: number;
  goal: number;
  style?: StyleProp<ViewStyle>;
}

export const DailyPracticeCard: React.FC<DailyPracticeCardProps> = ({
  questionsAnswered,
  goal,
  style,
}) => {
  const isGoalReached = questionsAnswered >= goal;
  const isZero = questionsAnswered === 0;

  const countText = isZero
    ? 'Ready for a few questions?'
    : `${questionsAnswered} question${questionsAnswered === 1 ? '' : 's'} answered`;

  const statusText = isGoalReached
    ? 'Daily goal reached'
    : `Goal: ${goal} question${goal === 1 ? '' : 's'}`;

  return (
    <View
      style={[styles.card, style]}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Today's practice: ${countText}. ${statusText}.`}
    >
      <Text style={styles.heading}>Today's practice</Text>
      <View style={styles.content}>
        <Text style={styles.countText}>{countText}</Text>
        <Text style={[styles.statusText, isGoalReached && styles.statusGoalReached]}>
          {statusText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  heading: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusGoalReached: {
    color: colors.success,
  },
});
