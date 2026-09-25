import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, layout, spacing } from '../../constants/colors';
import {
  generateParentChallenge,
  verifyParentChallenge,
} from '../../features/settings/parentLock';
import { ParentChallenge } from '../../features/settings/settingsTypes';

interface ParentLockChallengeModalProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ParentLockChallengeModal({
  visible,
  onSuccess,
  onCancel,
}: ParentLockChallengeModalProps) {
  const [challenge, setChallenge] = useState<ParentChallenge>(generateParentChallenge);
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setChallenge(generateParentChallenge());
      setInputVal('');
      setFeedback(null);
    }
  }, [visible]);

  const handleSubmit = () => {
    const isCorrect = verifyParentChallenge(challenge.answer, inputVal);
    if (isCorrect) {
      setInputVal('');
      setFeedback(null);
      onSuccess();
    } else {
      // Calm, non-punitive feedback with a new question
      setInputVal('');
      setFeedback("That's not quite right. Let's try this one:");
      setChallenge(generateParentChallenge());
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Parent check</Text>
          <Text style={styles.prompt}>{challenge.prompt}</Text>

          {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}

          <View style={styles.questionBox}>
            <Text style={styles.questionText}>{challenge.question}</Text>
          </View>

          <TextInput
            style={styles.input}
            value={inputVal}
            onChangeText={setInputVal}
            keyboardType="number-pad"
            placeholder="Answer"
            placeholderTextColor="#9CA3AF"
            autoFocus={true}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
            accessible={true}
            accessibilityLabel="Arithmetic challenge answer input"
          />

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Confirm parent check"
            >
              <Text style={styles.submitButtonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cancel parent check"
            >
              <Text style={styles.cancelButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    marginBottom: spacing.xs,
  },
  prompt: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  questionBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: layout.borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  input: {
    width: '100%',
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.md,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  buttonGroup: {
    width: '100%',
    gap: spacing.sm,
  },
  submitButton: {
    minHeight: 56,
    backgroundColor: colors.accent,
    borderRadius: layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cancelButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
