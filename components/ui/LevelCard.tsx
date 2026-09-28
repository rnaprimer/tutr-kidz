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
import { LevelConfig } from '../../types/level';
import { LevelBadge } from '../illustrations/LevelBadges';
import { LEVEL_THEMES } from '../../constants/theme';

interface LevelCardProps {
  level: LevelConfig;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const LevelCard: React.FC<LevelCardProps> = ({
  level,
  onPress,
  style,
}) => {
  const theme = LEVEL_THEMES[level.id] || LEVEL_THEMES.toddler;

  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${level.title}, ${level.subtitle}`}
      accessibilityHint={`Opens activities for ${level.title}`}
      style={({ pressed }) => [
        styles.card,
        { borderColor: pressed ? theme.accentColor : theme.borderColor },
        pressed && styles.cardPressed,
        style,
      ]}
    >
      <View style={styles.badgeWrapper}>
        <LevelBadge levelId={level.id} size="normal" />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{level.title}</Text>
          <View style={[styles.pill, { backgroundColor: theme.bgLight }]}>
            <Text style={[styles.pillText, { color: theme.textColor }]}>Explore</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>{level.subtitle}</Text>
      </View>

      <View style={[styles.chevronContainer, { backgroundColor: theme.bgLight }]}>
        <Text style={[styles.chevron, { color: theme.accentColor }]}>›</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 76,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: colors.cardPressed,
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  badgeWrapper: {
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: layout.borderRadius.round,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: -2,
    marginLeft: 1,
  },
});
