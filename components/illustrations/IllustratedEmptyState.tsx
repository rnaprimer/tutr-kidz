import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';
import { MascotCharacter } from './MascotCharacter';
import { PrimaryButton } from '../ui/PrimaryButton';

interface IllustratedEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  symbol?: string;
}

export const IllustratedEmptyState: React.FC<IllustratedEmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  symbol = '🌱',
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.mascotWrapper}>
        <MascotCharacter pose="peaceful" size="medium" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton
          label={actionLabel}
          variant="secondary"
          onPress={onAction}
          style={styles.actionButton}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginVertical: spacing.md,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
    elevation: 1,
  },
  mascotWrapper: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: spacing.lg,
  },
  actionButton: {
    minWidth: 180,
  },
});
