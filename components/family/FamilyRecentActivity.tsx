import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';
import { getLevelById } from '../../constants/levels';
import { FamilyActivity } from '../../features/familyInsights/familyInsightTypes';

interface FamilyRecentActivityProps {
  activities: FamilyActivity[];
}

function formatDateGroup(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    if (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    ) {
      return 'Today';
    }
    const yesterday = new Date(now.getTime() - 86400000);
    if (
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate()
    ) {
      return 'Yesterday';
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export const FamilyRecentActivity: React.FC<FamilyRecentActivityProps> = ({
  activities,
}) => {
  if (activities.length === 0) {
    return null;
  }

  // Group activities by date
  const grouped: Record<string, FamilyActivity[]> = {};
  for (const act of activities) {
    const groupKey = formatDateGroup(act.lastPlayedAt);
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(act);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeading}>Recent Family Activity</Text>
      <View style={styles.list}>
        {Object.entries(grouped).map(([groupName, items]) => (
          <View key={groupName} style={styles.groupContainer}>
            <Text style={styles.groupHeader}>{groupName}</Text>
            <View style={styles.groupCards}>
              {items.map((item, index) => {
                const levelConfig = getLevelById(item.level);
                const levelTitle = levelConfig?.title ?? item.level;
                const formattedTopic = item.topic.charAt(0).toUpperCase() + item.topic.slice(1);

                return (
                  <View
                    key={`${item.childId}-${item.topic}-${item.lastPlayedAt}-${index}`}
                    style={styles.activityRow}
                    accessible={true}
                    accessibilityRole="text"
                    accessibilityLabel={`${item.childName}, ${formattedTopic}, ${levelTitle}, scored ${item.score} out of ${item.total}.`}
                  >
                    <View style={styles.infoCol}>
                      <View style={styles.childRow}>
                        <Text style={styles.childName}>{item.childName}</Text>
                        <Text style={styles.levelText}>· {levelTitle}</Text>
                      </View>
                      <Text style={styles.topicName}>{formattedTopic}</Text>
                    </View>
                    <View style={styles.scoreCol}>
                      <Text style={styles.scoreText}>
                        {item.score} / {item.total}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
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
    gap: spacing.lg,
  },
  groupContainer: {
    gap: spacing.xs,
  },
  groupHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 2,
    marginBottom: 4,
  },
  groupCards: {
    gap: spacing.xs,
  },
  activityRow: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56, // Accessible touch target
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  childName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  levelText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  topicName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  scoreCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: spacing.md,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
});
