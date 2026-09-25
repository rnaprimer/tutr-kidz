import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, layout } from '../../../constants/colors';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { ParentLockChallengeModal } from '../../../components/settings/ParentLockChallengeModal';
import { useParentAccess } from '../../../features/settings/useParentAccess';
import { useAuth } from '../../../features/auth/useAuth';

export default function ForgotPasswordScreen() {
  const { isLocked, checking, handleUnlockSuccess, handleUnlockCancel } = useParentAccess();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendReset = async () => {
    setErrorMessage(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    await resetPassword(cleanEmail);
    setSubmitting(false);

    // Always show generic message to avoid email enumeration
    setSubmitted(true);
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
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
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.brandTitle}>Tutr Kidz</Text>
              <Text style={styles.heading}>Reset password</Text>
              <Text style={styles.subtitle}>
                Enter the email address associated with your parent account.
              </Text>
            </View>

            {submitted ? (
              <View style={styles.successCard} accessible={true} accessibilityRole="alert">
                <Text style={styles.successTitle}>Instructions sent</Text>
                <Text style={styles.successMessage}>
                  If an account exists for {email.trim()}, you will receive instructions to reset your password.
                </Text>
                <View style={styles.successAction}>
                  <PrimaryButton
                    label="Back to Sign In"
                    onPress={() => router.replace('/parent/account/login')}
                    accessibilityLabel="Return to sign in screen"
                  />
                </View>
              </View>
            ) : (
              <>
                {/* Error Banner */}
                {errorMessage ? (
                  <View style={styles.errorBanner} accessible={true} accessibilityRole="alert">
                    <Text style={styles.errorBannerText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Form */}
                <View style={styles.formCard}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Email address</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="parent@example.com"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!submitting}
                      accessibilityLabel="Email input for password reset"
                    />
                  </View>

                  <View style={styles.submitContainer}>
                    {submitting ? (
                      <View style={styles.loadingButtonWrapper}>
                        <ActivityIndicator size="small" color={colors.accent} />
                      </View>
                    ) : (
                      <PrimaryButton
                        label="Send Reset Link"
                        onPress={handleSendReset}
                        accessibilityLabel="Send reset link button"
                      />
                    )}
                  </View>
                </View>

                {/* Switch back */}
                <View style={styles.switchContainer}>
                  <TouchableOpacity
                    onPress={() => router.replace('/parent/account/login')}
                    style={styles.switchLink}
                    accessibilityRole="link"
                    accessibilityLabel="Back to sign in"
                  >
                    <Text style={styles.switchLinkText}>← Back to Sign In</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Footer Back */}
            <View style={styles.footer}>
              <PrimaryButton
                label="Cancel"
                variant="tertiary"
                onPress={() => router.back()}
                accessibilityLabel="Back to parent account"
              />
            </View>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.huge,
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  heading: {
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
    maxWidth: 320,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: layout.borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#B91C1C',
    lineHeight: 20,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    height: 56,
    backgroundColor: colors.background,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.text,
  },
  submitContainer: {
    marginTop: spacing.xs,
  },
  loadingButtonWrapper: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  switchLink: {
    minHeight: 44,
    justifyContent: 'center',
  },
  switchLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  successCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15803D',
  },
  successMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  successAction: {
    width: '100%',
    marginTop: spacing.sm,
  },
  footer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
});
