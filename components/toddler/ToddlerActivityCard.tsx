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
import { ToddlerActivityId } from '../../types/quiz';

interface ToddlerActivityCardProps {
  id: ToddlerActivityId;
  symbol: string;
  title: string;
  progressText?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const ACTIVITY_PALETTES: Record<ToddlerActivityId, { bg: string; border: string; accent: string }> = {
  colours: { bg: '#FEF2F2', border: '#FECDD3', accent: '#E11D48' },
  shapes: { bg: '#EFF6FF', border: '#BFDBFE', accent: '#2563EB' },
  numbers: { bg: '#F0FDF4', border: '#BBF7D0', accent: '#16A34A' },
  matching: { bg: '#FEFCE8', border: '#FEF08A', accent: '#D97706' },
};

export const ToddlerActivityCard: React.FC<ToddlerActivityCardProps> = ({
  id,
  symbol,
  title,
  progressText,
  onPress,
  style,
}) => {
  const palette = ACTIVITY_PALETTES[id] || ACTIVITY_PALETTES.colours;

  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Choose ${title}${progressText ? `, ${progressText}` : ''}`}
      accessibilityHint={`Starts the ${title} activity`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && styles.cardPressed,
        style,
      ]}
    >
      <View style={styles.symbolContainer}>
        <Text style={styles.symbol}>{symbol}</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: '#1F2937' }]}>{title}</Text>
        {progressText ? (
          <View style={styles.badgeWrapper}>
            <Text style={[styles.progressText, { color: palette.accent }]}>{progressText}</Text>
          </View>
        ) : (
          <Text style={styles.subtext}>Tap to explore</Text>
        )}
      </View>

      <View style={[styles.chevronContainer, { backgroundColor: '#FFFFFF' }]}>
        <Text style={[styles.chevron, { color: palette.accent }]}>›</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: layout.borderRadius.xl,
    borderWidth: 2,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 88,
    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.04)',
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
  symbolContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  },
  symbol: {
    fontSize: 30,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtext: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeWrapper: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: layout.borderRadius.round,
    marginTop: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  chevronContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  chevron: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: -2,
    marginLeft: 1,
  },
});
