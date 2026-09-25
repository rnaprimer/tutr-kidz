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

export default function LoginScreen() {
  const { isLocked, checking, handleUnlockSuccess, handleUnlockCancel } = useParentAccess();
  const { signIn, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setErrorMessage(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    const res = await signIn(cleanEmail, password);
    setSubmitting(false);

    if (res.success) {
      router.replace('/parent/account');
    } else {
      setErrorMessage(res.error || "We couldn't sign you in. Please check your details and try again.");
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
              <Text style={styles.heading}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Sign in to your parent account to sync learning progress across your devices.
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
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/parent/account/forgot-password')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="link"
                    accessibilityLabel="Forgot password"
                  >
                    <Text style={styles.linkText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!submitting}
                  accessibilityLabel="Password input"
                />
              </View>

              <View style={styles.submitContainer}>
                {submitting || isLoading ? (
                  <View style={styles.loadingButtonWrapper}>
                    <ActivityIndicator size="small" color={colors.accent} />
                  </View>
                ) : (
                  <PrimaryButton
                    label="Sign In"
                    onPress={handleSignIn}
                    accessibilityLabel="Sign in button"
                  />
                )}
              </View>
            </View>

            {/* Switch to Signup */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchPrompt}>Don't have an account?</Text>
              <TouchableOpacity
                onPress={() => router.push('/parent/account/signup')}
                style={styles.switchLink}
                accessibilityRole="link"
                accessibilityLabel="Create an account"
              >
                <Text style={styles.switchLinkText}>Create one</Text>
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
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
