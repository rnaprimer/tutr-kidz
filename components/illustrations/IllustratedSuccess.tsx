import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { layout, spacing } from '../../constants/colors';
import { MascotCharacter } from './MascotCharacter';

interface IllustratedSuccessProps {
  isToddler?: boolean;
}

export const IllustratedSuccess: React.FC<IllustratedSuccessProps> = ({
  isToddler = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        <Text style={styles.sparkle}>✨</Text>
        <Text style={styles.star}>⭐</Text>
        <Text style={styles.sparkle}>✨</Text>
      </View>
      <MascotCharacter
        pose={isToddler ? 'toddler' : 'celebrating'}
        size="large"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: -10,
    zIndex: 10,
  },
  star: {
    fontSize: 24,
  },
  sparkle: {
    fontSize: 18,
    opacity: 0.8,
  },
});
