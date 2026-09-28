import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { layout, spacing } from '../../constants/colors';
import { MascotCharacter, MascotPose } from './MascotCharacter';

interface IllustratedWelcomeProps {
  step: number;
}

export const IllustratedWelcome: React.FC<IllustratedWelcomeProps> = ({ step }) => {
  let pose: MascotPose = 'welcoming';
  let badgeText = 'Welcome';
  let ambientSymbol = '🌱';

  if (step === 2) {
    pose = 'reading';
    badgeText = 'Learner Profile';
    ambientSymbol = '✏️';
  } else if (step === 3) {
    pose = 'thinking';
    badgeText = 'Starting Point';
    ambientSymbol = '🧭';
  } else if (step === 4) {
    pose = 'celebrating';
    badgeText = "You're Ready";
    ambientSymbol = '🌟';
  }

  return (
    <View style={styles.container}>
      <View style={styles.ambientPill}>
        <Text style={styles.ambientSymbol}>{ambientSymbol}</Text>
        <Text style={styles.ambientText}>{badgeText}</Text>
      </View>
      <View style={styles.mascotWrapper}>
        <MascotCharacter pose={pose} size="large" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  ambientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: layout.borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: spacing.md,
    gap: 6,
  },
  ambientSymbol: {
    fontSize: 14,
  },
  ambientText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.3,
  },
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
