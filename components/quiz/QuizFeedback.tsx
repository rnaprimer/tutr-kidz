import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { layout, spacing } from '../../constants/colors';

interface QuizFeedbackProps {
  isCorrect: boolean;
  correctOptionLabel: string;
  customCorrectFeedback?: string;
  customIncorrectFeedback?: string;
}

export const QuizFeedback: React.FC<QuizFeedbackProps> = ({
  isCorrect,
  correctOptionLabel,
  customCorrectFeedback,
  customIncorrectFeedback,
}) => {
  const message = isCorrect
    ? customCorrectFeedback || '✓ That’s right.'
    : customIncorrectFeedback ||
      (correctOptionLabel
        ? `Let's try another. The answer was ${correctOptionLabel}.`
        : 'Good thinking. Let’s try another.');

  return (
    <View
      style={[
        styles.container,
        isCorrect ? styles.containerCorrect : styles.containerIncorrect,
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <View style={styles.contentRow}>
        <Text style={styles.icon}>{isCorrect ? '🌱' : '💡'}</Text>
        <Text
          style={[
            styles.text,
            isCorrect ? styles.textCorrect : styles.textIncorrect,
          ]}
        >
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: layout.borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
  },
  containerCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  containerIncorrect: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    flexShrink: 1,
  },
  textCorrect: {
    color: '#15803D',
  },
  textIncorrect: {
    color: '#B91C1C',
  },
});
