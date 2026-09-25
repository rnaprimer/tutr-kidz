import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';

interface SettingsSwitchProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function SettingsSwitch({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: SettingsSwitchProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={[styles.label, disabled && styles.disabledText]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, disabled && styles.disabledText]}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.white}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
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
});
