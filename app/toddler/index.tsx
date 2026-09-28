import { useDocumentTitle } from "../../lib/utils/useDocumentTitle";
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors, layout, spacing } from '../../constants/colors';
import { ToddlerActivityCard } from '../../components/toddler/ToddlerActivityCard';
import { IllustratedHeader } from '../../components/illustrations/IllustratedHeader';
import { ToddlerActivityId } from '../../types/quiz';
import { ProgressState } from '../../features/progress/types';
import { DEFAULT_PROGRESS, getProgress } from '../../features/progress/progressStorage';
import { getLevelTopicProgress } from '../../features/progress/progressUtils';

interface ActivityItem {
  id: ToddlerActivityId;
  symbol: string;
  title: string;
}

const ACTIVITIES: ActivityItem[] = [
  { id: 'colours', symbol: '🎨', title: 'Colours' },
  { id: 'shapes', symbol: '🔷', title: 'Shapes' },
  { id: 'numbers', symbol: '🔢', title: 'Numbers' },
  { id: 'matching', symbol: '🧩', title: 'Matching' },
];

export default function ToddlerActivitySelectionScreen() {
  useDocumentTitle("Tutr Kidz — Toddler");

  const [progress, setProgress] = useState<ProgressState>(DEFAULT_PROGRESS);

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

  const toddlerProgress = getLevelTopicProgress(progress, 'toddler');

  const handleSelectActivity = (activityId: ToddlerActivityId) => {
    router.push({
      pathname: '/quiz/[level]',
      params: { level: 'toddler', activity: activityId },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Illustrated Toddler Header */}
          <IllustratedHeader
            levelId="toddler"
            title="Toddler Play"
            subtitle="Colours, shapes, numbers & sounds"
          />

          <View style={styles.header}>
            <Text style={styles.sectionTitle}>What would you like to explore?</Text>
            <Text style={styles.sectionSubtitle}>Tap any activity to begin exploring together</Text>
          </View>

          <View style={styles.activitiesList}>
            {ACTIVITIES.map((activity) => {
              const record = toddlerProgress[activity.id];
              const progressText =
                record && record.attempts >= 1
                  ? 'Explored recently'
                  : 'Ready to explore';

              return (
                <ToddlerActivityCard
                  key={activity.id}
                  id={activity.id}
                  symbol={activity.symbol}
                  title={activity.title}
                  progressText={progressText}
                  onPress={() => handleSelectActivity(activity.id)}
                />
              );
            })}
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
    justifyContent: 'center',
  },
  contentContainer: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  header: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    textAlign: 'center',
    lineHeight: 32,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  activitiesList: {
    gap: 4,
  },
});
