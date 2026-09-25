import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors, layout, spacing } from '../../../constants/colors';
import { getFamilyState } from '../../../features/family/familyStorage';
import { ChildRecord, FamilyState } from '../../../features/family/familyTypes';
import { getSettings } from '../../../features/settings/settingsStorage';
import { ParentSettings } from '../../../features/settings/settingsTypes';
import { useParentAccess } from '../../../features/settings/useParentAccess';
import { ParentLockChallengeModal } from '../../../components/settings/ParentLockChallengeModal';
import { SettingsSection } from '../../../components/settings/SettingsSection';
import { SettingsRow } from '../../../components/settings/SettingsRow';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { getLevelById } from '../../../constants/levels';

export default function FamilySettingsScreen() {
  const { isLocked, checking, handleUnlockSuccess, handleUnlockCancel } = useParentAccess();
  const [familyState, setFamilyState] = useState<FamilyState | null>(null);
  const [settings, setSettings] = useState<ParentSettings | null>(null);

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

  if (checking || !familyState || !settings) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading family settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const childCount = Object.keys(familyState.children).length;
  const levelConfig = activeChild ? getLevelById(activeChild.profile.level) : null;
  const levelTitle = levelConfig?.title ?? (activeChild ? activeChild.profile.level : '');

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
            <Text style={styles.heading}>Family Settings</Text>
            <Text style={styles.subtitle}>
              Overview of family configuration, active learner, and default preferences.
            </Text>
          </View>

          {/* Section: Family Overview */}
          <SettingsSection
            title="Family Overview"
            description="Learners configured on this device."
          >
            <SettingsRow
              label="Learners"
              description={`${childCount} ${childCount === 1 ? 'learner' : 'learners'} registered`}
              rightContent={
                <Text style={styles.badgeText}>{childCount}</Text>
              }
            />

            <SettingsRow
              label="Active Learner"
              description={
                activeChild
                  ? `${activeChild.profile.name} (${levelTitle})`
                  : 'No active learner selected'
              }
              onPress={() => router.push('/parent/children')}
              accessibilityHint="Switches active learner"
              rightContent={
                <Text style={styles.actionLinkText}>Switch →</Text>
              }
            />

            <SettingsRow
              label="Manage Learners"
              description="Add, switch, or view individual learners"
              onPress={() => router.push('/parent/children')}
              accessibilityHint="Opens learner management screen"
              rightContent={
                <Text style={styles.actionLinkText}>Manage →</Text>
              }
            />
          </SettingsSection>

          {/* Section: Parent Controls */}
          <SettingsSection
            title="Parent Controls"
            description="Access protection and safety barriers."
          >
            <SettingsRow
              label="Parent Lock"
              description={
                settings.parentLockEnabled
                  ? 'Enabled — arithmetic challenge required for parent screens'
                  : 'Disabled — parent screens are openly accessible'
              }
              onPress={() => router.push('/parent/settings')}
              accessibilityHint="Opens parent settings to configure parent lock"
              rightContent={
                <Text
                  style={[
                    styles.statusBadge,
                    settings.parentLockEnabled
                      ? styles.statusBadgeActive
                      : styles.statusBadgeInactive,
                  ]}
                >
                  {settings.parentLockEnabled ? 'Active' : 'Off'}
                </Text>
              }
            />
          </SettingsSection>

          {/* Section: App Defaults */}
          <SettingsSection
            title="New Learner Defaults"
            description="Initial preferences applied when adding new learners."
          >
            <SettingsRow
              label="Default Daily Goal"
              description="Daily question target for new profiles"
              rightContent={
                <Text style={styles.valueText}>
                  {settings.defaultDailyQuestionGoal} questions
                </Text>
              }
            />

            <SettingsRow
              label="Session Question Count"
              description="Number of questions in standard quiz sessions"
              rightContent={
                <Text style={styles.valueText}>
                  {settings.sessionQuestionCount} questions
                </Text>
              }
            />

            <SettingsRow
              label="Level Visibility Default"
              description="Show all levels on home screen for new learners"
              rightContent={
                <Text style={styles.valueText}>
                  {settings.showAllLevelsByDefault ? 'All levels' : 'Current level only'}
                </Text>
              }
            />
          </SettingsSection>

          {/* Section: Shortcuts */}
          <SettingsSection
            title="Configuration Shortcuts"
            description="Quick access to settings and data controls."
          >
            <SettingsRow
              label="Parent Settings"
              description="Configure guidance, session length, accessibility, and parent lock"
              onPress={() => router.push('/parent/settings')}
              rightContent={<Text style={styles.actionLinkText}>Open →</Text>}
            />

            <SettingsRow
              label="Data & Privacy"
              description="Reset progress, remove learners, or restore settings"
              onPress={() => router.push('/parent/data')}
              rightContent={<Text style={styles.actionLinkText}>Open →</Text>}
            />
          </SettingsSection>

          {/* Back Navigation */}
          <View style={styles.footer}>
            <PrimaryButton
              label="Back to Family Dashboard"
              variant="tertiary"
              onPress={() => router.push('/parent/family')}
              accessibilityLabel="Back to family dashboard"
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
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.sm,
  },
  actionLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusBadge: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.sm,
  },
  statusBadgeActive: {
    color: '#15803D',
    backgroundColor: '#DCFCE7',
  },
  statusBadgeInactive: {
    color: colors.textSecondary,
    backgroundColor: '#F3F4F6',
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
