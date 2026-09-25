import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';

interface DestructiveActionProps {
  title: string;
  description: string;
  buttonLabel: string;
  confirmTitle: string;
  confirmMessage: string;
  confirmButtonLabel?: string;
  onPress: () => void | Promise<void>;
  requireConfirmation?: boolean;
}

export function DestructiveAction({
  title,
  description,
  buttonLabel,
  confirmTitle,
  confirmMessage,
  confirmButtonLabel = 'Confirm',
  onPress,
  requireConfirmation = true,
}: DestructiveActionProps) {
  const handleTrigger = () => {
    if (!requireConfirmation) {
      onPress();
      return;
    }

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const fullMessage = `${confirmTitle}\n\n${confirmMessage}`;
        if (window.confirm(fullMessage)) {
          onPress();
        }
      }
    } else {
      Alert.alert(confirmTitle, confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: confirmButtonLabel,
          style: 'destructive',
          onPress,
        },
      ]);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handleTrigger}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        accessibilityHint={`Triggers ${title}`}
      >
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  button: {
    minHeight: 56,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
    letterSpacing: -0.2,
  },
});
