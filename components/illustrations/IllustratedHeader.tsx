import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';
import { LevelBadge } from './LevelBadges';
import { LevelId } from '../../types/level';
import { LEVEL_THEMES } from '../../constants/theme';

interface IllustratedHeaderProps {
  levelId: LevelId;
  title: string;
  subtitle: string;
}

export const IllustratedHeader: React.FC<IllustratedHeaderProps> = ({
  levelId,
  title,
  subtitle,
}) => {
  const theme = LEVEL_THEMES[levelId] || LEVEL_THEMES.toddler;

  return (
    <View style={[styles.card, { backgroundColor: theme.bgLight, borderColor: theme.borderColor }]}>
      <View style={styles.badgeWrapper}>
        <LevelBadge levelId={levelId} size="large" />
      </View>
      <View style={styles.textWrapper}>
        <Text style={[styles.title, { color: theme.textColor }]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1.5,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
    elevation: 1,
  },
  badgeWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 19,
  },
});
