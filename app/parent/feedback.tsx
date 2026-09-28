import { useDocumentTitle } from "../../lib/utils/useDocumentTitle";
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, layout, spacing } from '../../constants/colors';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ParentLockChallengeModal } from '../../components/settings/ParentLockChallengeModal';
import { useParentAccess } from '../../features/settings/useParentAccess';
import {
  FEEDBACK_CATEGORIES,
  FeedbackCategory,
} from '../../features/feedback/feedbackTypes';
import { submitFeedback } from '../../features/feedback/feedbackRepository';

export default function ParentFeedbackScreen() {
  useDocumentTitle("Tutr Kidz — Parent Feedback");

  const { isLocked, checking, handleUnlockSuccess, handleUnlockCancel } = useParentAccess();

  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory>("Learning experience");
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrorText(null);

    try {
      await submitFeedback(selectedCategory, message);
      setSubmitted(true);
    } catch {
      setErrorText("Couldn't save feedback right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setMessage('');
    setSubmitted(false);
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent} style={{ marginBottom: spacing.md }} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ParentLockChallengeModal
        visible={isLocked}
        onSuccess={handleUnlockSuccess}
        onCancel={handleUnlockCancel}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.brandTitle}>Tutr Kidz</Text>
              <Text style={styles.screenHeading}>Share Feedback</Text>
              <Text style={styles.subtitle}>
                Help us keep learning calm, simple, and distraction-free.
              </Text>
            </View>

            {submitted ? (
              /* Calm Confirmation State */
              <View style={styles.submittedCard} accessible={true} accessibilityRole="summary" accessibilityLabel="Feedback received confirmation">
                <Text style={styles.submittedTitle}>Thank You</Text>
                <Text style={styles.submittedMessage}>
                  Your feedback has been saved. It helps us ensure Tutr Kidz remains gentle, focused, and child-safe.
                </Text>
                <View style={styles.submittedActions}>
                  <PrimaryButton
                    label="Send more feedback"
                    variant="secondary"
                    onPress={handleReset}
                    accessibilityLabel="Send more feedback"
                    style={{ minHeight: 48 }}
                  />
                  <PrimaryButton
                    label="Back to Parent Settings"
                    variant="tertiary"
                    onPress={() => router.back()}
                    accessibilityLabel="Back to parent settings"
                    style={{ minHeight: 48 }}
                  />
                </View>
              </View>
            ) : (
              /* Feedback Input Form */
              <View style={styles.formContainer}>
                {errorText ? (
                  <View style={styles.errorBanner} accessible={true} accessibilityRole="alert">
                    <Text style={styles.errorBannerText}>{errorText}</Text>
                  </View>
                ) : null}

                {/* Category Picker */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Category</Text>
                  <View style={styles.categoryList}>
                    {FEEDBACK_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat;
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => setSelectedCategory(cat)}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                          accessibilityLabel={cat}
                          style={({ pressed }) => [
                            styles.categoryChip,
                            isSelected && styles.categoryChipSelected,
                            pressed && styles.categoryChipPressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              isSelected && styles.categoryChipTextSelected,
                            ]}
                          >
                            {cat}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Optional Message */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Your Thoughts (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Tell us what you noticed or would like to see..."
                    placeholderTextColor={colors.textMuted}
                    multiline={true}
                    numberOfLines={4}
                    maxLength={1000}
                    textAlignVertical="top"
                    accessible={true}
                    accessibilityLabel="Feedback message input"
                    accessibilityHint="Optional message to describe your feedback"
                  />
                  <Text style={styles.charCount}>
                    {message.length} / 1000 characters
                  </Text>
                </View>

                {/* Privacy & Offline Notice */}
                <View style={styles.noticeCard}>
                  <Text style={styles.noticeText}>
                    Feedback is stored locally first and securely synced when online. Child names and personal identifiers are never included.
                  </Text>
                </View>

                {/* Submit Action */}
                <View style={styles.actionGroup}>
                  <PrimaryButton
                    label={submitting ? "Sending..." : "Submit Feedback"}
                    variant="primary"
                    disabled={submitting}
                    onPress={handleSubmit}
                    accessibilityLabel="Submit feedback"
                    style={{ minHeight: 48 }}
                  />

                  <PrimaryButton
                    label="Cancel"
                    variant="tertiary"
                    onPress={() => router.back()}
                    accessibilityLabel="Cancel and return"
                    style={{ minHeight: 48 }}
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
  contentContainer: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  screenHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    gap: spacing.xl,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: layout.borderRadius.md,
    padding: spacing.md,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#B91C1C',
    textAlign: 'center',
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    minHeight: 48,
    justifyContent: 'center',
  },
  categoryChipSelected: {
    borderColor: colors.accent,
    backgroundColor: '#FAF9FF',
  },
  categoryChipPressed: {
    backgroundColor: colors.cardPressed,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: colors.accent,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    minHeight: 120,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
  },
  noticeCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  noticeText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionGroup: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  submittedCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  submittedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
  },
  submittedMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  submittedActions: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
