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

export default function SignupScreen() {
  const { isLocked, checking, handleUnlockSuccess, handleUnlockCancel } = useParentAccess();
  const { signUp, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateForm = (): string | null => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      return 'Please enter your email address.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return 'Please enter a valid email address.';
    }
    if (!password) {
      return 'Please enter a password.';
    }
    if (password.length < 6) {
      return 'Please use a password with at least 6 characters.';
    }
    if (password !== confirmPassword) {
      return 'Your passwords do not match. Please verify and try again.';
    }
    return null;
  };

  const handleSignUp = async () => {
    setErrorMessage(null);
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSubmitting(true);
    const res = await signUp(email.trim(), password, name.trim() || undefined);
    setSubmitting(false);

    if (res.success) {
      router.replace('/parent/account');
    } else {
      setErrorMessage(
        res.error || "We couldn't create your account. Please check your details and try again."
      );
    }
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
              <Text style={styles.heading}>Create parent account</Text>
              <Text style={styles.subtitle}>
                Safeguard your family's learning and keep history accessible across all your devices.
              </Text>
            </View>

            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBanner} accessible={true} accessibilityRole="alert">
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View style={styles.formCard}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Your name (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Rahul"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  editable={!submitting}
                  accessibilityLabel="Your name input"
                />
              </View>

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
                  accessibilityLabel="Parent email address input"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!submitting}
                  accessibilityLabel="Password input"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Repeat your password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!submitting}
                  accessibilityLabel="Confirm password input"
                />
              </View>

              <View style={styles.submitContainer}>
                {submitting || isLoading ? (
                  <View style={styles.loadingButtonWrapper}>
                    <ActivityIndicator size="small" color={colors.accent} />
                  </View>
                ) : (
                  <PrimaryButton
                    label="Create Account"
                    onPress={handleSignUp}
                    accessibilityLabel="Create parent account button"
                  />
                )}
              </View>
            </View>

            {/* Switch to Login */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchPrompt}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => router.push('/parent/account/login')}
                style={styles.switchLink}
                accessibilityRole="link"
                accessibilityLabel="Sign in to existing account"
              >
                <Text style={styles.switchLinkText}>Sign in</Text>
              </TouchableOpacity>
            </View>

            {/* Footer Back */}
            <View style={styles.footer}>
              <PrimaryButton
                label="Cancel"
                variant="tertiary"
                onPress={() => router.back()}
                accessibilityLabel="Back to account screen"
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
    paddingTop: spacing.lg,
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
    marginBottom: spacing.xl,
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
    gap: spacing.md,
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
    marginTop: spacing.sm,
  },
  loadingButtonWrapper: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  switchPrompt: {
    fontSize: 14,
    color: colors.textSecondary,
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
  footer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
});
