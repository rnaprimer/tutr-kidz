import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';
import { LevelInsight } from '../../features/insights/insightTypes';

interface LevelInsightCardProps {
  insight: LevelInsight;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const LevelInsightCard: React.FC<LevelInsightCardProps> = ({
  insight,
  onPress,
  style,
}) => {
  const isToddler = insight.level === 'toddler';
  const hasStarted = insight.startedTopics > 0;

  const topicsText = isToddler
    ? `${insight.startedTopics} of ${insight.totalTopics} activities started`
    : `${insight.startedTopics} of ${insight.totalTopics} topics started`;

  const accuracyText = hasStarted
    ? `${insight.accuracy}% accuracy`
    : 'Not started';

  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${insight.title}: ${topicsText}, ${accuracyText}`}
      accessibilityHint={`Navigates to ${insight.title} overview`}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{insight.title}</Text>
        <Text style={styles.subtitle}>{topicsText}</Text>
      </View>
      <View style={styles.rightColumn}>
        <Text style={[styles.accuracy, !hasStarted && styles.notStarted]}>
          {accuracyText}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: colors.cardPressed,
    opacity: 0.94,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  accuracy: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  notStarted: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 22,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: -2,
  },
});
