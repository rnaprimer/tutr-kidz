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
import { QuizOption as QuizOptionType, OptionVisualState } from '../../types/quiz';
import { QuizVisualRenderer } from './QuizVisualRenderer';

interface QuizOptionProps {
  option: QuizOptionType;
  state: OptionVisualState;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const QuizOption: React.FC<QuizOptionProps> = ({
  option,
  state,
  onPress,
  disabled = false,
  style,
}) => {
  const isCorrect = state === 'correct';
  const isIncorrect = state === 'incorrect';
  const isLocked = state === 'neutral-locked';

  const defaultAccessibilityLabel = option.visual
    ? option.accessibilityLabel || 'Option'
    : `Answer ${option.label}`;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={option.accessibilityLabel || defaultAccessibilityLabel}
      accessibilityState={{
        disabled,
        selected: isCorrect || isIncorrect,
      }}
      style={({ pressed }) => [
        styles.button,
        state === 'default' && pressed && styles.buttonPressed,
        isCorrect && styles.buttonCorrect,
        isIncorrect && styles.buttonIncorrect,
        isLocked && styles.buttonLocked,
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {option.visual ? (
          <View style={styles.visualWrapper}>
            <QuizVisualRenderer visual={option.visual} size="normal" />
          </View>
        ) : null}

        {option.label ? (
          <Text
            style={[
              styles.label,
              isCorrect && styles.labelCorrect,
              isIncorrect && styles.labelIncorrect,
              isLocked && styles.labelLocked,
              option.visual && styles.labelWithVisual,
            ]}
          >
            {option.label}
          </Text>
        ) : null}
      </View>

      {isCorrect && (
        <View style={styles.badgeCorrect}>
          <Text style={styles.badgeText}>✓</Text>
        </View>
      )}

      {isIncorrect && (
        <View style={styles.badgeIncorrect}>
          <Text style={styles.badgeText}>✕</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.card,
    minHeight: 68,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 6,
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
    elevation: 1,
  },
  buttonPressed: {
    backgroundColor: colors.cardPressed,
    opacity: 0.92,
  },
  buttonCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: colors.success,
    borderWidth: 2,
  },
  buttonIncorrect: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.error,
    borderWidth: 2,
  },
  buttonLocked: {
    backgroundColor: '#FAFAF8',
    borderColor: colors.borderLight,
    opacity: 0.8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  labelWithVisual: {
    marginLeft: spacing.md,
    fontSize: 20,
  },
  labelCorrect: {
    color: '#15803D',
  },
  labelIncorrect: {
    color: '#B91C1C',
  },
  labelLocked: {
    color: colors.textSecondary,
  },
  badgeCorrect: {
    position: 'absolute',
    right: spacing.lg,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIncorrect: {
    position: 'absolute',
    right: spacing.lg,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
