import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors, layout, spacing } from '../../constants/colors';
import { getLevelById } from '../../constants/levels';
import {
  getFamilyState,
  removeChild,
  resetFamily,
  updateChild,
} from '../../features/family/familyStorage';
import { ChildRecord, FamilyState, LearningPreferences } from '../../features/family/familyTypes';
import { resetProgress } from '../../features/progress/progressStorage';
import {
  getSettings,
  resetSettings,
  updateSettings,
} from '../../features/settings/settingsStorage';
import { ParentSettings } from '../../features/settings/settingsTypes';
import { isParentUnlocked, lockParent } from '../../features/settings/parentSession';
import { useParentAccess } from '../../features/settings/useParentAccess';
import { ParentLockChallengeModal } from '../../components/settings/ParentLockChallengeModal';
import { SettingsSection } from '../../components/settings/SettingsSection';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { SettingsSwitch } from '../../components/settings/SettingsSwitch';
import { SettingsOptionGroup } from '../../components/settings/SettingsOptionGroup';
import { DestructiveAction } from '../../components/settings/DestructiveAction';
import { PreferenceRow } from '../../components/profile/PreferenceRow';
import { PrimaryButton } from '../../components/ui/PrimaryButton';

const GOAL_OPTIONS: Array<LearningPreferences['dailyQuestionGoal']> = [5, 10, 15, 20];
const SESSION_OPTIONS: Array<{ value: 5 | 10; label: string; description: string }> = [
  { value: 5, label: '5 questions', description: 'Standard quick quiz session' },
  { value: 10, label: '10 questions', description: 'Extended practice session' },
];

export default function ParentSettingsScreen() {
  const { isLocked, checking, handleUnlockSuccess, handleUnlockCancel } = useParentAccess();
  const [familyState, setFamilyState] = useState<FamilyState | null>(null);
  const [settings, setSettings] = useState<ParentSettings | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      Promise.all([getFamilyState(), getSettings()]).then(([fState, appSettings]) => {
        if (isMounted) {
          setFamilyState(fState);
          setSettings(appSettings);
        }
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const activeChild: ChildRecord | null =
    familyState && familyState.activeChildId
      ? familyState.children[familyState.activeChildId] ?? null
      : null;

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // --- Child-specific settings ---
  const handleGoalSelect = async (goal: LearningPreferences['dailyQuestionGoal']) => {
    if (!activeChild) return;
    const updated = await updateChild(activeChild.profile.id, {
      preferences: { dailyQuestionGoal: goal },
    });
    if (updated) {
      const state = await getFamilyState();
      setFamilyState(state);
    }
  };

  const handleToggleShowAllLevels = async (value: boolean) => {
    if (!activeChild) return;
    const updated = await updateChild(activeChild.profile.id, {
      preferences: { showAllLevels: value },
    });
    if (updated) {
      const state = await getFamilyState();
      setFamilyState(state);
    }
  };

  // --- App-wide settings ---
  const handleSessionLengthSelect = async (count: 5 | 10) => {
    const updated = await updateSettings({ sessionQuestionCount: count });
    setSettings(updated);
  };

  const handleToggleReduceMotion = async (value: boolean) => {
    const updated = await updateSettings({ reduceMotion: value });
    setSettings(updated);
  };

  const handleToggleParentLock = async (value: boolean) => {
    const updated = await updateSettings({ parentLockEnabled: value });
    setSettings(updated);
  };

  const handleToggleRequireConfirmation = async (value: boolean) => {
    const updated = await updateSettings({ requireParentConfirmationForReset: value });
    setSettings(updated);
  };

  const handleManualLock = () => {
    lockParent();
    router.replace('/');
  };

  // --- Destructive Actions ---
  const handleResetProgress = async () => {
    if (!activeChild) return;
    const childName = activeChild.profile.name;
    await resetProgress(activeChild.profile.id);
    showStatus(`${childName}'s learning progress has been reset.`);
  };

  const handleRemoveChild = async () => {
    if (!activeChild) return;
    const childName = activeChild.profile.name;
    const childId = activeChild.profile.id;
    await removeChild(childId);
    const nextState = await getFamilyState();
    setFamilyState(nextState);
    if (!nextState.activeChildId) {
      router.replace('/');
    } else {
      showStatus(`${childName}'s profile has been removed.`);
    }
  };

  const handleResetAllFamily = async () => {
    await resetFamily();
    showStatus('All family learners and progress removed.');
    setTimeout(() => {
      router.replace('/');
    }, 1500);
  };

  const handleResetAppSettings = async () => {
    const defaults = await resetSettings();
    setSettings(defaults);
    showStatus('Parent settings restored to defaults.');
  };

  if (checking || !familyState || !settings) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const child = activeChild?.profile;
  const childPreferences = activeChild?.preferences;
  const levelConfig = child ? getLevelById(child.level) : null;
  const levelTitle = levelConfig?.title ?? (child ? child.level : '');
  const childName = child ? child.name : 'Current Learner';
  const requireConfirm = settings.requireParentConfirmationForReset;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ParentLockChallengeModal
        visible={isLocked}
        onSuccess={handleUnlockSuccess}
        onCancel={handleUnlockCancel}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>Tutr Kidz</Text>
            {child ? <Text style={styles.childHeaderName}>{child.name}</Text> : null}
            <Text style={styles.heading}>Parent Settings</Text>
            <Text style={styles.subtitle}>
              Manage learner profiles, learning guidance, and app configuration.
            </Text>
          </View>

          {/* Reset status banner */}
          {statusMessage ? (
            <View style={styles.statusBanner} accessible={true} accessibilityRole="alert">
              <Text style={styles.statusBannerText}>{statusMessage}</Text>
            </View>
          ) : null}

          {/* 1. LEARNER SECTION */}
          <SettingsSection
            title="Learner"
            description="Manage and switch the active learner profile."
          >
            <View style={styles.childCard}>
              <View style={styles.childInfo}>
                <Text style={styles.childLabel}>Active Learner</Text>
                {child ? (
                  <>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childLevel}>{levelTitle}</Text>
                  </>
                ) : (
                  <Text style={styles.childEmptyText}>No learner profile selected</Text>
                )}
              </View>
              <View style={styles.childActions}>
                <PrimaryButton
                  label={child ? 'Edit Current Learner →' : 'Set up learner profile →'}
                  variant="secondary"
                  onPress={() => {
                    if (child) {
                      router.push({
                        pathname: '/profile',
                        params: { childId: child.id },
                      });
                    } else {
                      router.push('/profile');
                    }
                  }}
                  accessibilityLabel={child ? `Edit ${child.name}'s profile` : 'Set up profile'}
                />
                <PrimaryButton
                  label="Switch Learner →"
                  variant="tertiary"
                  onPress={() => router.push('/parent/children')}
                  accessibilityLabel="Switch active learner"
                />
                <PrimaryButton
                  label="Manage All Learners →"
                  variant="tertiary"
                  onPress={() => router.push('/parent/children')}
                  accessibilityLabel="Manage all family learners"
                />
              </View>
            </View>
          </SettingsSection>

          {/* 2. LEARNING GUIDANCE SECTION */}
          <SettingsSection
            title="Learning Guidance"
            description="Configure daily goals, session length, and level visibility."
          >
            {/* Child-specific Daily Question Guidance */}
            {childPreferences ? (
              <View style={styles.subSection}>
                <Text style={styles.subSectionHeading}>
                  Daily Question Guidance ({childName})
                </Text>
                <Text style={styles.subSectionDescription}>
                  Recommended number of practice questions per day for {childName}.
                </Text>
                <View style={styles.optionList}>
                  {GOAL_OPTIONS.map((goal) => {
                    const isSelected = childPreferences.dailyQuestionGoal === goal;
                    return (
                      <PreferenceRow
                        key={goal}
                        title={`${goal} questions`}
                        selected={isSelected}
                        accessibilityRole="radio"
                        accessibilityLabel={`Daily question guidance: ${goal} questions`}
                        onPress={() => handleGoalSelect(goal)}
                        rightContent={
                          isSelected ? (
                            <View style={styles.selectedIndicator}>
                              <Text style={styles.selectedIndicatorText}>✓</Text>
                            </View>
                          ) : null
                        }
                      />
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Default Session Length (App-Wide) */}
            <View style={styles.subSection}>
              <SettingsOptionGroup<5 | 10>
                label="Default Session Length"
                description="Number of questions in standard quiz sessions across the app."
                options={SESSION_OPTIONS}
                selectedValue={settings.sessionQuestionCount}
                onSelect={handleSessionLengthSelect}
              />
            </View>

            {/* Child-specific Level Visibility */}
            {childPreferences ? (
              <View style={styles.subSection}>
                <SettingsSwitch
                  label="Show all learning levels"
                  description={`When off, the Home screen displays only ${childName}'s current level.`}
                  value={childPreferences.showAllLevels}
                  onValueChange={handleToggleShowAllLevels}
                />
              </View>
            ) : null}
          </SettingsSection>

          {/* 3. ACCESSIBILITY SECTION */}
          <SettingsSection
            title="Accessibility"
            description="Visual preferences for a calm experience."
          >
            <SettingsSwitch
              label="Reduce motion"
              description="Minimize visual transitions and animated screen shifts."
              value={settings.reduceMotion}
              onValueChange={handleToggleReduceMotion}
            />
          </SettingsSection>

          {/* 4. PARENT CONTROLS SECTION */}
          <SettingsSection
            title="Parent Controls"
            description="Safeguard parent settings with a simple challenge."
          >
            <SettingsSwitch
              label="Parent lock"
              description="Requires a simple arithmetic question before entering parent screens."
              value={settings.parentLockEnabled}
              onValueChange={handleToggleParentLock}
            />

            <SettingsSwitch
              label="Require confirmation for reset"
              description="Displays a confirmation prompt before clearing data or removing learners."
              value={settings.requireParentConfirmationForReset}
              onValueChange={handleToggleRequireConfirmation}
            />

            {settings.parentLockEnabled && isParentUnlocked() ? (
              <SettingsRow
                label="Lock parent controls"
                description="Immediately re-locks parent screens for this session."
                onPress={handleManualLock}
                rightContent={
                  <Text style={styles.lockBadgeText}>Lock now</Text>
                }
              />
            ) : null}
          </SettingsSection>

          {/* 5. DATA & DESTRUCTIVE SECTION */}
          <SettingsSection
            title="Data & Privacy"
            description="Manage data, reset learning history, or clear settings."
          >
            <SettingsRow
              label="Cloud Backup & Parent Account →"
              description="Sign in and back up family learning records to cloud"
              onPress={() => router.push('/parent/account')}
              rightContent={<Text style={styles.actionLinkText}>Open →</Text>}
            />

            <SettingsRow
              label="Data & Privacy Overview →"
              description="Full overview of data management on this device"
              onPress={() => router.push('/parent/data')}
              rightContent={<Text style={styles.actionLinkText}>Open →</Text>}
            />

            {child ? (
              <>
                <DestructiveAction
                  title={`Reset ${child.name}'s learning progress`}
                  description="Clears this learner's quiz history. Their profile and preferences remain unchanged."
                  buttonLabel="Reset Learning Progress"
                  confirmTitle="Reset learning progress?"
                  confirmMessage={`This will remove ${child.name}'s saved quiz history from this device.\n\nThis cannot be undone.`}
                  confirmButtonLabel="Reset Progress"
                  onPress={handleResetProgress}
                  requireConfirmation={requireConfirm}
                />

                <DestructiveAction
                  title={`Remove ${child.name}'s profile`}
                  description="Deletes this learner's profile, preferences, and quiz progress from this device."
                  buttonLabel={`Remove ${child.name}`}
                  confirmTitle={`Remove ${child.name}?`}
                  confirmMessage={`This will remove ${child.name}'s profile, preferences, and saved progress completely.\n\nThis cannot be undone.`}
                  confirmButtonLabel="Remove Learner"
                  onPress={handleRemoveChild}
                  requireConfirmation={requireConfirm}
                />
              </>
            ) : null}

            <DestructiveAction
              title="Reset family data"
              description="Removes all learners and all learning records across the entire family."
              buttonLabel="Reset Family Data"
              confirmTitle="Reset family data?"
              confirmMessage="This will remove all learner profiles and all quiz records on this device.\n\nThis cannot be undone."
              confirmButtonLabel="Reset Family"
              onPress={handleResetAllFamily}
              requireConfirmation={requireConfirm}
            />

            <DestructiveAction
              title="Reset parent settings"
              description="Restores parent controls, session length, and guidance defaults to their original values."
              buttonLabel="Reset Parent Settings"
              confirmTitle="Reset parent settings?"
              confirmMessage="This will restore all parent preferences to default settings. Learner profiles and progress are not affected."
              confirmButtonLabel="Reset Settings"
              onPress={handleResetAppSettings}
              requireConfirmation={requireConfirm}
            />
          </SettingsSection>

          {/* Navigation Back */}
          <View style={styles.footer}>
            <PrimaryButton
              label="Back to Parent Dashboard"
              variant="tertiary"
              onPress={() => router.push('/parent')}
              accessibilityLabel="Back to parent dashboard"
            />
          </View>
        </View>
      </ScrollView>
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
    marginBottom: spacing.xxl,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  childHeaderName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },
  heading: {
    fontSize: 30,
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
  statusBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: layout.borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  statusBannerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#15803D',
  },
  childCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  childInfo: {
    marginBottom: spacing.lg,
  },
  childLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  childName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  childLevel: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  childEmptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  childActions: {
    gap: spacing.sm,
  },
  subSection: {
    marginBottom: spacing.lg,
  },
  subSectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  subSectionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  optionList: {
    gap: spacing.xs,
  },
  selectedIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  actionLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
  lockBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.sm,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
