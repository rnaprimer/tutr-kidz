import { useDocumentTitle } from "../../lib/utils/useDocumentTitle";
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, layout, spacing } from '../../constants/colors';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { LevelSelector } from '../../components/profile/LevelSelector';
import { IllustratedWelcome } from '../../components/illustrations/IllustratedWelcome';
import { CurriculumLevel } from '../../types/curriculum';
import { getLevelById } from '../../constants/levels';
import {
  getFamilyState,
  addChild,
  setActiveChild,
} from '../../features/family/familyRepository';
import {
  hasCompletedOnboarding,
  markOnboardingCompleted,
} from '../../features/onboarding';
import { trackEvent } from '../../lib/analytics';

export default function ParentOnboardingScreen() {
  useDocumentTitle("Tutr Kidz — Welcome");

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [childName, setChildName] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<CurriculumLevel>('class-1');
  const [nameError, setNameError] = useState<string>('');
  const [checking, setChecking] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const checkReturningParent = async () => {
      try {
        const family = await getFamilyState();
        const hasLearners = Object.keys(family.children).length > 0;
        const completed = await hasCompletedOnboarding();

        if (isMounted) {
          if (hasLearners && completed) {
            // Returning parent: bypass onboarding directly to Family Home
            router.replace('/parent');
            return;
          }
          trackEvent('onboarding_started');
          setChecking(false);
        }
      } catch {
        if (isMounted) setChecking(false);
      }
    };

    checkReturningParent();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNextFromStep2 = () => {
    const trimmed = childName.trim();
    if (!trimmed) {
      setNameError("Please enter your child's name");
      return;
    }
    setNameError('');
    setStep(3);
  };

  const handleCompleteOnboarding = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const trimmed = childName.trim() || 'Learner';
      const newChild = await addChild({
        name: trimmed,
        level: selectedLevel,
        preferences: {
          dailyQuestionGoal: 5,
          showAllLevels: true,
        },
      });

      await setActiveChild(newChild.profile.id);
      await markOnboardingCompleted();

      trackEvent('onboarding_completed');
      trackEvent('learner_created');
      trackEvent('first_learning_session_started', { level: selectedLevel });

      // Navigate smoothly to the learner's first session
      if (selectedLevel === 'toddler') {
        router.replace('/toddler');
      } else {
        router.replace(`/level/${selectedLevel}`);
      }
    } catch {
      // In case of error, still complete and go to root
      await markOnboardingCompleted();
      router.replace('/');
    } finally {
      setSubmitting(false);
    }
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

  const levelConfig = getLevelById(selectedLevel);
  const levelTitle = levelConfig?.title ?? selectedLevel;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
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
            {/* Header Brand */}
            <View style={styles.header}>
              <Text style={styles.brandTitle}>Tutr Kidz</Text>
              <Text style={styles.stepIndicator}>Step {step} of 4</Text>
            </View>

            {/* STEP 1: WELCOME */}
            {step === 1 ? (
              <View style={styles.stepCard} accessible={true} accessibilityRole="summary" accessibilityLabel="Step 1: Welcome to Tutr Kidz">
                <IllustratedWelcome step={1} />
                <Text style={styles.heading}>Welcome to Tutr Kidz</Text>
                <Text style={styles.subtitle}>
                  Simple learning for curious minds.
                </Text>

                <View style={styles.philosophyBox}>
                  <View style={styles.philosophyItem}>
                    <Text style={styles.philosophyDot}>•</Text>
                    <Text style={styles.philosophyText}>
                      One question. One screen. One simple interaction.
                    </Text>
                  </View>
                  <View style={styles.philosophyItem}>
                    <Text style={styles.philosophyDot}>•</Text>
                    <Text style={styles.philosophyText}>
                      No streaks, scores, timer pressure, or competitive rankings.
                    </Text>
                  </View>
                  <View style={styles.philosophyItem}>
                    <Text style={styles.philosophyDot}>•</Text>
                    <Text style={styles.philosophyText}>
                      The parent owns the account. The child owns the learning experience.
                    </Text>
                  </View>
                </View>

                <View style={styles.buttonGroup}>
                  <PrimaryButton
                    label="Get Started →"
                    variant="primary"
                    onPress={() => setStep(2)}
                    accessibilityLabel="Get Started"
                    style={{ minHeight: 48 }}
                  />
                </View>
              </View>
            ) : null}

            {/* STEP 2: WHO IS LEARNING TODAY */}
            {step === 2 ? (
              <View style={styles.stepCard} accessible={true} accessibilityRole="summary" accessibilityLabel="Step 2: Who is learning today">
                <IllustratedWelcome step={2} />
                <Text style={styles.heading}>Who is learning today?</Text>
                <Text style={styles.subtitle}>
                  Create your first learner profile. You can add more children anytime.
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Child's name</Text>
                  <TextInput
                    style={[styles.textInput, !!nameError && styles.textInputError]}
                    value={childName}
                    onChangeText={(val) => {
                      setChildName(val);
                      if (nameError) setNameError('');
                    }}
                    placeholder="Enter child's name"
                    placeholderTextColor={colors.textMuted}
                    maxLength={40}
                    autoCapitalize="words"
                    autoCorrect={false}
                    accessible={true}
                    accessibilityLabel="Child name input"
                    accessibilityHint="Enter the name of your child"
                  />
                  {nameError ? (
                    <Text style={styles.errorText} accessibilityRole="alert">
                      {nameError}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.buttonGroup}>
                  <PrimaryButton
                    label="Continue →"
                    variant="primary"
                    onPress={handleNextFromStep2}
                    accessibilityLabel="Continue to next step"
                    style={{ minHeight: 48 }}
                  />
                  <PrimaryButton
                    label="Back"
                    variant="tertiary"
                    onPress={() => setStep(1)}
                    accessibilityLabel="Back to previous step"
                    style={{ minHeight: 48 }}
                  />
                </View>
              </View>
            ) : null}

            {/* STEP 3: CHOOSE A STARTING POINT */}
            {step === 3 ? (
              <View style={styles.stepCard} accessible={true} accessibilityRole="summary" accessibilityLabel="Step 3: Choose a starting point">
                <IllustratedWelcome step={3} />
                <Text style={styles.heading}>Choose a starting point</Text>
                <Text style={styles.subtitle}>
                  Select where {childName.trim() || 'your child'} will begin. You can change this anytime.
                </Text>

                <View style={styles.selectorContainer}>
                  <LevelSelector
                    selectedLevel={selectedLevel}
                    onSelectLevel={(lvl) => setSelectedLevel(lvl)}
                  />
                </View>

                <View style={styles.buttonGroup}>
                  <PrimaryButton
                    label="Continue →"
                    variant="primary"
                    onPress={() => setStep(4)}
                    accessibilityLabel="Continue to final step"
                    style={{ minHeight: 48 }}
                  />
                  <PrimaryButton
                    label="Back"
                    variant="tertiary"
                    onPress={() => setStep(2)}
                    accessibilityLabel="Back to previous step"
                    style={{ minHeight: 48 }}
                  />
                </View>
              </View>
            ) : null}

            {/* STEP 4: YOU'RE READY */}
            {step === 4 ? (
              <View style={styles.stepCard} accessible={true} accessibilityRole="summary" accessibilityLabel="Step 4: You are ready">
                <IllustratedWelcome step={4} />
                <Text style={styles.heading}>You're ready!</Text>
                <Text style={styles.subtitle}>
                  The child can explore at their own pace.
                </Text>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Learner</Text>
                    <Text style={styles.summaryValue}>{childName.trim()}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Starting Level</Text>
                    <Text style={styles.summaryValue}>{levelTitle}</Text>
                  </View>
                </View>

                <Text style={styles.calmEncouragement}>
                  There are no time limits or missed-day penalties. Learning happens naturally when curiosity strikes.
                </Text>

                <View style={styles.buttonGroup}>
                  <PrimaryButton
                    label={submitting ? "Setting up..." : "Start Learning"}
                    variant="primary"
                    disabled={submitting}
                    onPress={handleCompleteOnboarding}
                    accessibilityLabel="Start learning"
                    accessibilityHint="Completes setup and begins learning"
                    style={{ minHeight: 48 }}
                  />
                  <PrimaryButton
                    label="Back"
                    variant="tertiary"
                    disabled={submitting}
                    onPress={() => setStep(3)}
                    accessibilityLabel="Back to level selection"
                    style={{ minHeight: 48 }}
                  />
                </View>
              </View>
            ) : null}
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
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -0.4,
  },
  stepIndicator: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  stepCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
    elevation: 1,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  philosophyBox: {
    backgroundColor: colors.background,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  philosophyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  philosophyDot: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '800',
    lineHeight: 22,
  },
  philosophyText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  formGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  textInput: {
    height: 52,
    backgroundColor: colors.background,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.text,
  },
  textInputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    marginTop: 2,
  },
  selectorContainer: {
    marginVertical: spacing.xs,
  },
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  calmEncouragement: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonGroup: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
