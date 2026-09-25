import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';
import { LEVELS } from '../../constants/levels';
import { CurriculumLevel } from '../../types/curriculum';

interface LevelSelectorProps {
  selectedLevel: CurriculumLevel | null;
  onSelectLevel: (level: CurriculumLevel) => void;
  style?: StyleProp<ViewStyle>;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  selectedLevel,
  onSelectLevel,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {LEVELS.map((levelItem) => {
        const isSelected = selectedLevel === levelItem.id;
        const levelId = levelItem.id as CurriculumLevel;

        return (
          <Pressable
            key={levelItem.id}
            onPress={() => onSelectLevel(levelId)}
            accessible={true}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Select ${levelItem.title}`}
            accessibilityHint={`Sets child learning level to ${levelItem.title}`}
            style={({ pressed }) => [
              styles.card,
              isSelected && styles.cardSelected,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.cardContent}>
              <Text style={[styles.title, isSelected && styles.titleSelected]}>
                {levelItem.title}
              </Text>
              <Text style={styles.subtitle}>{levelItem.subtitle}</Text>
            </View>
            <View
              style={[
                styles.radioOuter,
                isSelected && styles.radioOuterSelected,
              ]}
            >
              {isSelected && <View style={styles.radioInner} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64, // Satisfies minimum 56px touch target
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: '#FAF9FF', // Subtle, restrained accent tint
  },
  cardPressed: {
    backgroundColor: colors.cardPressed,
    opacity: 0.95,
  },
  cardContent: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  titleSelected: {
    color: colors.accent,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  radioOuterSelected: {
    borderColor: colors.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
});
