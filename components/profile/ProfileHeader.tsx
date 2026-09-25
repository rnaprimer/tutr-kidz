import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';
import { getLevelById } from '../../constants/levels';
import { CurriculumLevel } from '../../types/curriculum';

interface ProfileHeaderProps {
  name: string;
  level?: CurriculumLevel | null;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  level,
  subtitle,
  style,
}) => {
  const levelConfig = level ? getLevelById(level) : undefined;
  const levelTitle = levelConfig?.title ?? level;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle}>{subtitle}</Text>
      ) : levelTitle ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{levelTitle}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: layout.borderRadius.sm,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
});
