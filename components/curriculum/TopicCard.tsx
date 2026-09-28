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

interface TopicCardProps {
  id: string;
  title: string;
  description: string;
  symbol?: string;
  progressText?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const TopicCard: React.FC<TopicCardProps> = ({
  title,
  description,
  symbol = '📖',
  progressText,
  onPress,
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Topic: ${title}${progressText ? `, ${progressText}` : ''}`}
      accessibilityHint={`Starts quiz for ${title}: ${description}`}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      <View style={styles.symbolContainer}>
        <Text style={styles.symbol}>{symbol}</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        {progressText ? (
          <View style={styles.badgeWrapper}>
            <Text style={styles.progressText}>{progressText}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.chevronContainer}>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#EFEFEA',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: colors.cardPressed,
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  symbolContainer: {
    width: 48,
    height: 48,
    borderRadius: layout.borderRadius.md,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  symbol: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  badgeWrapper: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: layout.borderRadius.round,
    marginTop: 4,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.2,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: -2,
    marginLeft: 1,
  },
});
