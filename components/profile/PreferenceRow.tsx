import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';

interface PreferenceRowProps {
  title: string;
  description?: string;
  selected?: boolean;
  rightContent?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'radio' | 'checkbox' | 'switch';
  style?: StyleProp<ViewStyle>;
}

export const PreferenceRow: React.FC<PreferenceRowProps> = ({
  title,
  description,
  selected,
  rightContent,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  style,
}) => {
  const content = (
    <>
      <View style={styles.textContainer}>
        <Text style={[styles.title, selected && styles.titleSelected]}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      {rightContent ? (
        <View style={styles.rightContainer}>{rightContent}</View>
      ) : null}
    </>
  );

  if (!onPress || disabled) {
    return (
      <View style={[styles.container, selected && styles.containerSelected, style]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel || `${title}${description ? `, ${description}` : ''}`}
      style={({ pressed }) => [
        styles.container,
        selected && styles.containerSelected,
        pressed && styles.containerPressed,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56, // Accessible touch target
  },
  containerSelected: {
    borderColor: colors.accent,
    backgroundColor: '#FAF9FF',
  },
  containerPressed: {
    backgroundColor: colors.cardPressed,
  },
  textContainer: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
  },
  titleSelected: {
    color: colors.accent,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  rightContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
