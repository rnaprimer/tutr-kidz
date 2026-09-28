import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';

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
      <View style={styles.pillContainer}>
        <Text style={styles.pillIcon}>✨</Text>
        <Text style={styles.text}>
          Question {current} of {total}
        </Text>
      </View>
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
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: layout.borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: spacing.sm,
    gap: 6,
  },
  pillIcon: {
    fontSize: 12,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.2,
  },
  track: {
    width: 80,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E9D5FF',
    overflow: 'hidden',
  },
  indicator: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
});
