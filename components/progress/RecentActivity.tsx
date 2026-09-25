import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';
import { ProgressRecord } from '../../features/progress/types';
import { getTopicAccuracy } from '../../features/progress/progressUtils';
import { getTopicConfig } from '../../data/curriculum';
import { getLevelById } from '../../constants/levels';

interface RecentActivityProps {
  records: ProgressRecord[];
  style?: StyleProp<ViewStyle>;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  records,
  style,
}) => {
  if (records.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.sectionHeading}>Recently practiced</Text>
      <View style={styles.list}>
        {records.map((record) => {
          const topicConfig = getTopicConfig(record.level, record.topic);
          const levelConfig = getLevelById(record.level);
          const title =
            topicConfig?.title ??
            record.topic.charAt(0).toUpperCase() + record.topic.slice(1);
          const levelTitle = levelConfig?.title ?? record.level;
          const accuracy = getTopicAccuracy(record);

          return (
            <View key={`${record.level}:${record.topic}`} style={styles.itemCard}>
              <View style={styles.leftColumn}>
                <Text style={styles.topicTitle}>{title}</Text>
                <Text style={styles.levelSubtitle}>{levelTitle}</Text>
              </View>
              <View style={styles.rightColumn}>
                <Text style={styles.accuracyText}>{accuracy}% accuracy</Text>
                <Text style={styles.scoreText}>
                  Latest: {record.lastScore}/{record.lastTotal}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  leftColumn: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  levelSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  accuracyText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  scoreText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
