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
      <View style={styles.topRow}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeIcon}>✨</Text>
          <Text style={styles.eyebrow}>Today's learning</Text>
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={onPress}
        activeOpacity={0.85}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${actionLabel} today's learning: ${title}`}
        accessibilityHint="Navigates to topic choices"
      >
        <Text style={styles.actionButtonText}>{actionLabel} →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FEFCE8',
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    padding: spacing.xl,
    marginVertical: spacing.md,
    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.06)',
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: layout.borderRadius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FDE047',
    gap: 4,
  },
  badgeIcon: {
    fontSize: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: -0.4,
    marginBottom: spacing.xs,
    marginTop: 2,
  },
  description: {
    fontSize: 15,
    color: '#92400E',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  actionButton: {
    minHeight: 56,
    backgroundColor: '#D97706',
    borderRadius: layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    boxShadow: '0 3px 8px rgba(217, 119, 6, 0.2)',
    elevation: 2,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
