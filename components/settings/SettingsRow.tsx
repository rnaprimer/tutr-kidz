import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AccessibilityRole,
} from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';

interface SettingsRowProps {
  label: string;
  description?: string;
  rightContent?: React.ReactNode;
  onPress?: () => void;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
}

export function SettingsRow({
  label,
  description,
  rightContent,
  onPress,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
}: SettingsRowProps) {
  const content = (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={[styles.label, disabled && styles.disabledText]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, disabled && styles.disabledText]}>
            {description}
          </Text>
        ) : null}
      </View>
      {rightContent ? <View style={styles.rightContent}>{rightContent}</View> : null}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={styles.touchable}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole={accessibilityRole ?? 'button'}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={styles.touchable}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  touchable: {
    minHeight: 56,
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  rightContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
