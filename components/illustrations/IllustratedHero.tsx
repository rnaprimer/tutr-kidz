import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';
import { MascotCharacter } from './MascotCharacter';

interface IllustratedHeroProps {
  greeting?: string;
  subtitle?: string;
  tagline?: string;
}

export const IllustratedHero: React.FC<IllustratedHeroProps> = ({
  greeting = 'Hello, Learner! 👋',
  subtitle = 'Ready to explore today?',
  tagline = 'Small Questions. Big Learning.',
}) => {
  return (
    <View style={styles.card}>
      {/* Decorative ambient elements */}
      <View style={styles.ambientTopLeft}>
        <Text style={styles.ambientSymbol}>☁️</Text>
      </View>
      <View style={styles.ambientTopRight}>
        <Text style={styles.ambientSymbol}>✨</Text>
      </View>

      <View style={styles.contentRow}>
        <View style={styles.mascotWrapper}>
          <MascotCharacter pose="welcoming" size="medium" />
        </View>

        <View style={styles.textColumn}>
          <Text style={styles.greeting} numberOfLines={2}>{greeting}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.pillBadge}>
            <Text style={styles.pillText}>{tagline}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAF5FF',
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.05)',
    elevation: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3B0764',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B21A8',
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 20,
  },
  pillBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: layout.borderRadius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.2,
  },
  ambientTopLeft: {
    position: 'absolute',
    top: 6,
    left: 12,
    opacity: 0.6,
  },
  ambientTopRight: {
    position: 'absolute',
    top: 8,
    right: 14,
    opacity: 0.7,
  },
  ambientSymbol: {
    fontSize: 14,
  },
});
