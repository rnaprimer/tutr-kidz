import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';

interface TodayProgressProps {
  questionsAnsweredToday: number;
  dailyQuestionGoal: number;
  isGoalEnabled: boolean;
  style?: StyleProp<ViewStyle>;
}

export const TodayProgress: React.FC<TodayProgressProps> = ({
  questionsAnsweredToday,
  dailyQuestionGoal,
  isGoalEnabled,
  style,
}) => {
  if (!isGoalEnabled) {
    return null;
  }

  const isGoalReached = questionsAnsweredToday >= dailyQuestionGoal;
  const isZero = questionsAnsweredToday === 0;

  let mainText = `${questionsAnsweredToday} of ${dailyQuestionGoal} questions answered`;
  let subText = `${Math.max(0, dailyQuestionGoal - questionsAnsweredToday)} questions remaining`;

  if (isZero) {
    mainText = 'No questions yet';
    subText = `Goal: ${dailyQuestionGoal} questions`;
  } else if (isGoalReached) {
    mainText = "Today's practice is complete.";
    subText = "You can keep learning whenever you're ready.";
  }

  return (
    <View
      style={[styles.card, style]}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Today's practice: ${mainText}. ${subText}`}
    >
      <Text style={styles.eyebrow}>Today's practice</Text>
      <View style={styles.body}>
        <Text style={[styles.mainText, isGoalReached && styles.mainTextComplete]}>
          {mainText}
        </Text>
        <Text style={styles.subText}>{subText}</Text>
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
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
    elevation: 1,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  body: {
    gap: 2,
  },
  mainText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  mainTextComplete: {
    color: '#15803D',
  },
  subText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
