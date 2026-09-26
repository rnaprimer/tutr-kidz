import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';
import { DailyLearningRecommendation } from '../../features/dailyLearning/dailyLearningTypes';

interface DailyPracticeCardProps {
  recommendation: DailyLearningRecommendation;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const DailyPracticeCard: React.FC<DailyPracticeCardProps> = ({
  recommendation,
  onPress,
  style,
}) => {
  const { title, description, actionLabel } = recommendation;

  return (
    <View style={[styles.card, style]} accessible={true}>
      <Text style={styles.eyebrow}>Today's learning</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={onPress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${actionLabel} today's learning: ${title}`}
        accessibilityHint="Navigates to topic choices"
      >
        <Text style={styles.actionButtonText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
    padding: spacing.xl,
    marginVertical: spacing.md,
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
    elevation: 1,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  actionButton: {
    minHeight: 56,
    backgroundColor: colors.accent,
    borderRadius: layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
