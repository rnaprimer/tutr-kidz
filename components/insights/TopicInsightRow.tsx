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
import { TopicInsight } from '../../features/insights/insightTypes';

interface TopicInsightRowProps {
  topic: TopicInsight;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const TopicInsightRow: React.FC<TopicInsightRowProps> = ({
  topic,
  onPress,
  style,
}) => {
  const hasAttempts = topic.attempts >= 1;
  const statusLabel = hasAttempts ? 'Completed' : 'Not started';

  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Topic ${topic.title}: ${topic.accuracy}% accuracy, latest score ${topic.lastScore} of ${topic.lastTotal}`}
      accessibilityHint={`Opens topic selection for ${topic.title}`}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
        style,
      ]}
    >
      <View style={styles.leftColumn}>
        <Text style={styles.title}>{topic.title}</Text>
        <Text style={styles.status}>{statusLabel}</Text>
      </View>
      <View style={styles.rightColumn}>
        {hasAttempts ? (
          <>
            <Text style={styles.accuracy}>{topic.accuracy}%</Text>
            <Text style={styles.latest}>
              Latest: {topic.lastScore}/{topic.lastTotal}
            </Text>
          </>
        ) : (
          <Text style={styles.notStarted}>Not started</Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  rowPressed: {
    backgroundColor: colors.cardPressed,
  },
  leftColumn: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  status: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  accuracy: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  latest: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notStarted: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
