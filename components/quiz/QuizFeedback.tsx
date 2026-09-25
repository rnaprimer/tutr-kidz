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
    ? customCorrectFeedback || '✓ Great!'
    : customIncorrectFeedback ||
      (correctOptionLabel
        ? `Not quite. The answer is ${correctOptionLabel}.`
        : 'Not quite.');

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
      <Text
        style={[
          styles.text,
          isCorrect ? styles.textCorrect : styles.textIncorrect,
        ]}
      >
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: layout.borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  containerCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  containerIncorrect: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  textCorrect: {
    color: '#15803D',
  },
  textIncorrect: {
    color: '#B91C1C',
  },
});
