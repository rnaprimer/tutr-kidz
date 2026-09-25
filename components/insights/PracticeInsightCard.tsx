import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';
import { TopicInsight } from '../../features/insights/insightTypes';
import { PrimaryButton } from '../ui/PrimaryButton';
import { getLevelById } from '../../constants/levels';

interface PracticeInsightCardProps {
  topic: TopicInsight;
  onPractice: () => void;
  style?: StyleProp<ViewStyle>;
}

export const PracticeInsightCard: React.FC<PracticeInsightCardProps> = ({
  topic,
  onPractice,
  style,
}) => {
  const levelTitle = getLevelById(topic.level)?.title ?? topic.level;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.topicTitle}>{topic.title}</Text>
          <Text style={styles.levelSubtitle}>{levelTitle}</Text>
        </View>
        <Text style={styles.accuracy}>{topic.accuracy}% accuracy</Text>
      </View>

      <Text style={styles.prompt}>
        Practice a few more questions to build confidence.
      </Text>

      <PrimaryButton
        label="Practice"
        variant="secondary"
        onPress={onPractice}
        style={styles.practiceButton}
        accessibilityLabel={`Practice ${topic.title}`}
        accessibilityHint={`Navigates to topic selection for ${topic.title}`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginVertical: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  titleColumn: {
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
  accuracy: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  prompt: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginVertical: spacing.md,
  },
  practiceButton: {
    width: '100%',
    minHeight: 48,
  },
});
