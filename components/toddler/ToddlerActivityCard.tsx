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

export const ToddlerActivityCard: React.FC<ToddlerActivityCardProps> = ({
  symbol,
  title,
  progressText,
  onPress,
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Choose ${title}${progressText ? `, ${progressText}` : ''}`}
      accessibilityHint={`Starts the ${title} activity`}
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
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
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
    fontSize: 26,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    marginTop: 2,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: -2,
    marginLeft: 2,
  },
});
