import { useDocumentTitle } from "../../../lib/utils/useDocumentTitle";
import React, { useState, useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { colors, layout, spacing } from '../../../constants/colors';
import { getLevelById } from '../../../constants/levels';
import { getTopicsForLevel } from '../../../data/curriculum';
import { CurriculumLevel } from '../../../types/curriculum';
import { TopicCard } from '../../../components/curriculum/TopicCard';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { ProgressState } from '../../../features/progress/types';
import { DEFAULT_PROGRESS, getProgress } from '../../../features/progress/progressStorage';
import { getLevelTopicProgress, getTopicAccuracy } from '../../../features/progress/progressUtils';

export default function LevelTopicsScreen() {
  const { level: levelParam } = useLocalSearchParams<{ level: string }>();
  const levelId = (typeof levelParam === 'string' ? levelParam : '') as CurriculumLevel;
  const levelConfig = getLevelById(levelId);
  useDocumentTitle(levelConfig ? `Tutr Kidz — ${levelConfig.title} Topics` : "Tutr Kidz — Topics");
  const topics = getTopicsForLevel(levelId);

  const [progress, setProgress] = useState<ProgressState>(DEFAULT_PROGRESS);

  useEffect(() => {
    trackEvent('topic_exploration_opened');
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      getProgress().then((data) => {
        if (isMounted) setProgress(data);
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  if (!levelConfig || topics.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.contentContainer, { paddingHorizontal: spacing.xl, justifyContent: 'center', flex: 1, alignItems: 'center' }]}>
          <Text style={styles.brandTitle}>Tutr Kidz</Text>
          <Text style={[styles.screenHeading, { fontSize: 24, marginVertical: spacing.md, textAlign: 'center' }]}>
            That learning level isn't available.
          </Text>
          <Text style={[styles.subtitle, { marginBottom: spacing.xl, textAlign: 'center' }]}>
            Please select one of the available classes or toddler activities.
          </Text>
          <PrimaryButton
            label="Return Home"
            onPress={() => router.replace('/')}
            style={{ width: '100%', maxWidth: 280 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const topicProgress = getLevelTopicProgress(progress, levelId);
  const displayTitle = levelConfig?.title ?? 'Class';

  const handleSelectTopic = (topicId: string) => {
    router.push({
      pathname: '/quiz/[level]',
      params: {
        level: levelId,
        topic: topicId,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.brandTitle}>Tutr Kidz</Text>
            <Text style={styles.screenHeading}>{displayTitle}</Text>
            <Text style={styles.subtitle}>Choose a topic to begin</Text>
          </View>

          <View style={styles.topicList}>
            {topics.map((topic) => {
              const record = topicProgress[topic.id];
              const progressText =
                record && record.attempts >= 1
                  ? record.questionsAnswered >= 15
                    ? 'Familiar'
                    : 'Practiced'
                  : 'Ready to explore';

              return (
                <TopicCard
                  key={topic.id}
                  id={topic.id}
                  title={topic.title}
                  description={topic.description}
                  symbol={topic.symbol}
                  progressText={progressText}
                  onPress={() => handleSelectTopic(topic.id)}
                />
              );
            })}
          </View>

          <View style={styles.footer}>
            <PrimaryButton
              label="Back"
              variant="tertiary"
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              accessibilityHint="Returns to previous screen"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
  contentContainer: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  screenHeading: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  topicList: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  footer: {
    width: '100%',
    marginTop: spacing.sm,
  },
});
