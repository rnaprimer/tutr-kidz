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
  symbol,
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
      {symbol ? (
        <View style={styles.symbolContainer}>
          <Text style={styles.symbol}>{symbol}</Text>
        </View>
      ) : null}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        {progressText ? (
          <Text style={styles.progressText}>{progressText}</Text>
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
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: colors.cardPressed,
    opacity: 0.94,
  },
  symbolContainer: {
    width: 48,
    height: 48,
    borderRadius: layout.borderRadius.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  symbol: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    marginTop: 4,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: -2,
    marginLeft: 2,
  },
});
