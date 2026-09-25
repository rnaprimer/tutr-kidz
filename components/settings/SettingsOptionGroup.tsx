import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';

interface OptionItem<T> {
  value: T;
  label: string;
  description?: string;
}

interface SettingsOptionGroupProps<T> {
  label: string;
  description?: string;
  options: OptionItem<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  layoutDirection?: 'row' | 'column';
}

export function SettingsOptionGroup<T extends string | number>({
  label,
  description,
  options,
  selectedValue,
  onSelect,
  layoutDirection = 'column',
}: SettingsOptionGroupProps<T>) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View
        style={[
          styles.optionsContainer,
          layoutDirection === 'row' && styles.rowLayout,
        ]}
      >
        {options.map((option) => {
          const isSelected = option.value === selectedValue;
          return (
            <TouchableOpacity
              key={String(option.value)}
              style={[
                styles.optionButton,
                layoutDirection === 'row' && styles.rowOptionButton,
                isSelected && styles.optionButtonSelected,
              ]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${label}: ${option.label}`}
            >
              <View style={styles.optionTextContainer}>
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected && styles.optionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {option.description ? (
                  <Text style={styles.optionSubDescription}>
                    {option.description}
                  </Text>
                ) : null}
              </View>
              {isSelected ? (
                <View style={styles.checkIndicator}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  optionsContainer: {
    gap: spacing.xs,
  },
  rowLayout: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowOptionButton: {
    flex: 1,
  },
  optionButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: '#F5F3FF',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  optionLabelSelected: {
    color: colors.accent,
    fontWeight: '700',
  },
  optionSubDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  checkText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
