import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../constants/colors';

interface QuizProgressProps {
  current: number;
  total: number;
}

export const QuizProgress: React.FC<QuizProgressProps> = ({ current, total }) => {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Question ${current} of ${total}`}
    >
      <Text style={styles.text}>
        {current} / {total}
      </Text>
      <View style={styles.track}>
        <View style={[styles.indicator, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    width: '100%',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  track: {
    width: 64,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
  },
  indicator: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
});
