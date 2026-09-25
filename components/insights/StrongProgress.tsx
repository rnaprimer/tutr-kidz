import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';
import { TopicInsight } from '../../features/insights/insightTypes';
import { getLevelById } from '../../constants/levels';

interface StrongProgressProps {
  topics: TopicInsight[];
  style?: StyleProp<ViewStyle>;
}

export const StrongProgress: React.FC<StrongProgressProps> = ({
  topics,
  style,
}) => {
  if (topics.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.sectionHeading}>Strong Progress</Text>
      <View style={styles.list}>
        {topics.map((topic) => {
          const levelTitle = getLevelById(topic.level)?.title ?? topic.level;

          return (
            <View key={`${topic.level}:${topic.topic}`} style={styles.card}>
              <View style={styles.leftColumn}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.levelSubtitle}>{levelTitle}</Text>
              </View>
              <Text style={styles.accuracy}>{topic.accuracy}% accuracy</Text>
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
  card: {
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
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  levelSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  accuracy: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
});
