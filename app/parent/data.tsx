import { useDocumentTitle } from "../../lib/utils/useDocumentTitle";
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors, spacing, layout } from '../../constants/colors';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SettingsSection } from '../../components/settings/SettingsSection';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { DestructiveAction } from '../../components/settings/DestructiveAction';
import { ParentLockChallengeModal } from '../../components/settings/ParentLockChallengeModal';
import { useParentAccess } from '../../features/settings/useParentAccess';
import { useAuth } from '../../features/auth/useAuth';
import {
  getFamilyState,
  removeChild,
  resetFamily,
} from '../../features/family/familyRepository';
import { FamilyState, ChildRecord } from '../../features/family/familyTypes';
import {
  getSettings,
  resetSettings,
} from '../../features/settings/settingsRepository';
import { ParentSettings } from '../../features/settings/settingsTypes';
import {
  resetProgress,
  getProgress,
} from '../../features/progress/progressRepository';
import {
  getLastSyncedAt,
  syncNow,
  exportFamilyData,
  deleteParentAccount,
} from '../../features/sync/syncService';

export default function ParentDataScreen() {
  useDocumentTitle("Tutr Kidz — Parent Data & Privacy");

  const { isLocked, checking, handleUnlockSuccess, handleUnlockCancel } = useParentAccess();
  const { isAuthenticated, user } = useAuth();

  const [familyState, setFamilyState] = useState<FamilyState | null>(null);
  const [settings, setSettings] = useState<ParentSettings | null>(null);
  const [activeChild, setActiveChildState] = useState<ChildRecord | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Statistics
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState<number>(0);
  const [totalQuizAttempts, setTotalQuizAttempts] = useState<number>(0);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Export Data Modal
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportedJson, setExportedJson] = useState<string>('');

  // Delete Account Modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const currentFamily = await getFamilyState();
      setFamilyState(currentFamily);

      if (currentFamily.activeChildId && currentFamily.children[currentFamily.activeChildId]) {
        setActiveChildState(currentFamily.children[currentFamily.activeChildId]);
      } else {
        const childIds = Object.keys(currentFamily.children);
        if (childIds.length > 0) {
          setActiveChildState(currentFamily.children[childIds[0]]);
        } else {
          setActiveChildState(null);
        }
      }

      const currentSettings = await getSettings();
      setSettings(currentSettings);

      const syncedAt = await getLastSyncedAt();
      setLastSynced(syncedAt);

      // Compute statistics across all children
      let questions = 0;
      let attempts = 0;
      for (const childId of Object.keys(currentFamily.children)) {
        const prog = await getProgress(childId);
        questions += prog.overall.totalQuestionsAnswered;
        attempts += prog.overall.quizzesCompleted;
      }
      setTotalQuestionsAnswered(questions);
      setTotalQuizAttempts(attempts);
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const showStatus = (text: string) => {
    setStatusMessage(text);
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const handleSyncNow = async () => {
    if (syncing) return;
    setSyncing(true);
    const res = await syncNow();
    setSyncing(false);

    if (res.success) {
      setLastSynced(res.syncedAt || new Date().toISOString());
      showStatus('Cloud sync completed successfully.');
      await loadData();
    } else {
      showStatus(res.error || "Couldn't sync right now. Local data is safe.");
    }
  };

  const handleExportData = async () => {
    try {
      const json = await exportFamilyData();
      setExportedJson(json);
      setExportModalVisible(true);
    } catch {
      showStatus("Couldn't export data.");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim() !== 'DELETE') return;

    setIsDeleting(true);
    await deleteParentAccount();
    setIsDeleting(false);
    setDeleteModalVisible(false);
    setDeleteConfirmationText('');
    showStatus('Your account and family data have been deleted.');
    setTimeout(() => {
      router.replace('/');
    }, 1200);
  };

  const handleResetChildProgress = async () => {
    if (!activeChild) return;
    await resetProgress(activeChild.profile.id);
    showStatus(`${activeChild.profile.name}'s progress has been reset.`);
    await loadData();
  };

  const handleRemoveCurrentChild = async () => {
    if (!activeChild) return;
    const name = activeChild.profile.name;
    await removeChild(activeChild.profile.id);
    const nextState = await getFamilyState();
    setFamilyState(nextState);
    if (!nextState.activeChildId) {
      router.replace('/');
    } else {
      showStatus(`${name}'s profile has been removed.`);
      await loadData();
    }
  };

  const handleResetAllFamily = async () => {
    await resetFamily();
    showStatus('All learners and progress have been removed.');
    setTimeout(() => {
      router.replace('/');
    }, 1500);
  };

  const handleResetAppSettings = async () => {
    const defaults = await resetSettings();
    setSettings(defaults);
    showStatus('Parent settings restored to defaults.');
  };

  const formatLastSynced = (iso: string | null) => {
    if (!iso) return 'Not yet synced';
    try {
      const d = new Date(iso);
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Just now';
    }
  };

  if (checking || !familyState || !settings) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading data settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const childName = activeChild ? activeChild.profile.name : 'Current Learner';
  const requireConfirm = settings.requireParentConfirmationForReset;
  const learnerCount = Object.keys(familyState.children).length;

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
            <Text style={styles.heading}>Your family's data</Text>
            <Text style={styles.subtitle}>
              Keep your learners' records, progress, and cloud backups transparent and under your control.
            </Text>
          </View>

          {/* Status Message */}
          {statusMessage ? (
            <View style={styles.statusBanner} accessible={true} accessibilityRole="alert">
              <Text style={styles.statusBannerText}>{statusMessage}</Text>
            </View>
          ) : null}

          {/* Statistics Grid */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Learners</Text>
                <Text style={styles.statValue}>{learnerCount}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Questions answered</Text>
                <Text style={styles.statValue}>{totalQuestionsAnswered}</Text>
              </View>
            </View>
            <View style={styles.horizontalDivider} />
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Quiz attempts</Text>
                <Text style={styles.statValue}>{totalQuizAttempts}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Last synced</Text>
                <Text style={styles.statValueSmall}>{formatLastSynced(lastSynced)}</Text>
              </View>
            </View>
          </View>

          {/* Transparent Privacy & Data Information Card (Phase 19) */}
          <View style={styles.privacyCard} accessible={true} accessibilityRole="summary" accessibilityLabel="How Tutr Kidz handles your family data">
            <Text style={styles.privacyCardTitle}>How your family's data is handled</Text>
            <View style={styles.privacyBulletRow}>
              <Text style={styles.privacyBulletDot}>•</Text>
              <Text style={styles.privacyBulletText}>
                <Text style={styles.privacyBulletBold}>On Your Device: </Text>
                All learning progress, questions answered, and family settings are always stored locally first, so learning continues even without internet.
              </Text>
            </View>
            <View style={styles.privacyBulletRow}>
              <Text style={styles.privacyBulletDot}>•</Text>
              <Text style={styles.privacyBulletText}>
                <Text style={styles.privacyBulletBold}>In the Cloud: </Text>
                When signed in to a parent account, data syncs safely to your private family database. Children never have direct login tokens or credentials.
              </Text>
            </View>
            <View style={styles.privacyBulletRow}>
              <Text style={styles.privacyBulletDot}>•</Text>
              <Text style={styles.privacyBulletText}>
                <Text style={styles.privacyBulletBold}>Data Export: </Text>
                You can inspect or download your full raw family data at any time as JSON using the export option below.
              </Text>
            </View>
            <View style={styles.privacyBulletRow}>
              <Text style={styles.privacyBulletDot}>•</Text>
              <Text style={styles.privacyBulletText}>
                <Text style={styles.privacyBulletBold}>Data Removal: </Text>
                You can reset individual child records, clear all local device progress, or permanently delete your cloud parent account below.
              </Text>
            </View>
          </View>

          {/* Section: Cloud Backup */}
          <SettingsSection
            title="Cloud backup"
            description="Keep learning history backed up securely across devices."
          >
            <SettingsRow
              label="Backup status"
              rightContent={
                <View style={styles.backupStatusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      isAuthenticated ? styles.statusDotGreen : styles.statusDotMuted,
                    ]}
                  />
                  <Text style={styles.backupStatusText}>
                    {isAuthenticated ? 'Enabled' : 'Local only'}
                  </Text>
                </View>
              }
            />
            {isAuthenticated ? (
              <SettingsRow
                label="Sync now"
                description="Upload pending changes and retrieve cloud updates"
                onPress={handleSyncNow}
                rightContent={
                  syncing ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Text style={styles.actionLinkText}>Sync now</Text>
                  )
                }
              />
            ) : (
              <SettingsRow
                label="Enable cloud backup →"
                description="Sign in to sync your family's records"
                onPress={() => router.push('/parent/account')}
                rightContent={<Text style={styles.actionLinkText}>Sign in →</Text>}
              />
            )}
          </SettingsSection>

          {/* Section: Your Data */}
          <SettingsSection
            title="Your data"
            description="Export or remove account data at any time."
          >
            <SettingsRow
              label="Export my data"
              description="Save a complete readable copy of all family records"
              onPress={handleExportData}
              rightContent={<Text style={styles.actionLinkText}>Export →</Text>}
            />
            {isAuthenticated ? (
              <SettingsRow
                label="Delete account"
                description="Permanently delete cloud account and family data"
                onPress={() => {
                  setDeleteConfirmationText('');
                  setDeleteModalVisible(true);
                }}
                rightContent={<Text style={styles.destructiveText}>Delete</Text>}
              />
            ) : null}
          </SettingsSection>

          {/* Section: Current Learner Management */}
          {activeChild ? (
            <SettingsSection
              title="Current Learner"
              description={`Manage local data for ${childName}.`}
            >
              <DestructiveAction
                title={`Reset ${childName}'s learning progress`}
                description="Removes this learner's saved quiz history and scores. Their profile and preferences remain unchanged."
                buttonLabel="Reset Progress"
                confirmTitle="Reset learning progress?"
                confirmMessage={`This will remove ${childName}'s quiz history. Their profile will remain unchanged.\n\nThis cannot be undone.`}
                confirmButtonLabel="Reset Progress"
                onPress={handleResetChildProgress}
                requireConfirmation={requireConfirm}
              />

              <DestructiveAction
                title={`Remove ${childName}'s profile`}
                description="Permanently deletes this learner's profile, preferences, and all associated learning history."
                buttonLabel="Remove Learner"
                confirmTitle={`Remove ${childName}?`}
                confirmMessage={`This will remove ${childName}'s profile and all their learning history from this device.\n\nThis cannot be undone.`}
                confirmButtonLabel="Remove Learner"
                onPress={handleRemoveCurrentChild}
                requireConfirmation={requireConfirm}
              />
            </SettingsSection>
          ) : null}

          {/* Section: Family Data */}
          <SettingsSection
            title="Family"
            description="Manage data for all learners on this device."
          >
            <DestructiveAction
              title="Remove all learners"
              description="Removes every learner profile and deletes all quiz progress across the entire family."
              buttonLabel="Remove All Learners"
              confirmTitle="Remove all learners?"
              confirmMessage="This will permanently delete all learner profiles and all learning history from this device.\n\nThis cannot be undone."
              confirmButtonLabel="Remove All"
              onPress={handleResetAllFamily}
              requireConfirmation={requireConfirm}
            />
          </SettingsSection>

          {/* Section: App Settings */}
          <SettingsSection
            title="App Settings"
            description="Manage parent controls and configuration defaults."
          >
            <DestructiveAction
              title="Reset parent settings"
              description="Restores all parent controls, session lengths, guidance goals, and appearance settings to defaults."
              buttonLabel="Reset Parent Settings"
              confirmTitle="Reset parent settings?"
              confirmMessage="This will restore parent controls and configuration to default settings. Learner profiles and progress will not be touched."
              confirmButtonLabel="Reset Settings"
              onPress={handleResetAppSettings}
              requireConfirmation={requireConfirm}
            />
          </SettingsSection>

          {/* Back Navigation */}
          <View style={styles.footer}>
            <PrimaryButton
              label="Back to Parent Settings"
              variant="tertiary"
              onPress={() => router.back()}
              accessibilityLabel="Back to parent settings"
            />
          </View>
        </View>
      </ScrollView>

      {/* Export Data Modal */}
      <Modal
        visible={exportModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Exported Family Data</Text>
            <Text style={styles.modalSubtitle}>
              Here is your complete family data export:
            </Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalCodeText} selectable={true}>
                {exportedJson}
              </Text>
            </ScrollView>
            <View style={styles.modalButtonContainer}>
              <PrimaryButton
                label="Close"
                onPress={() => setExportModalVisible(false)}
                accessibilityLabel="Close export modal"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Account Deletion Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isDeleting) setDeleteModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalCard}>
            <Text style={styles.deleteModalTitle}>Delete Account</Text>
            <Text style={styles.deleteModalWarning}>
              Deleting your parent account will permanently remove:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• All child learner profiles</Text>
              <Text style={styles.bulletItem}>• All topic progress and scores</Text>
              <Text style={styles.bulletItem}>• All historical quiz attempts</Text>
              <Text style={styles.bulletItem}>• All family settings</Text>
            </View>
            <Text style={styles.deleteInstruction}>
              This action cannot be undone. To confirm, type{' '}
              <Text style={styles.deleteKeyword}>DELETE</Text> below:
            </Text>
            <TextInput
              style={styles.deleteInput}
              value={deleteConfirmationText}
              onChangeText={setDeleteConfirmationText}
              placeholder="Type DELETE"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isDeleting}
              accessibilityLabel="Confirm delete by typing DELETE"
            />
            <View style={styles.deleteActions}>
              {isDeleting ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <PrimaryButton
                    label="Delete Account & Data"
                    variant="primary" style={{ backgroundColor: '#DC2626' }}
                    disabled={deleteConfirmationText.trim() !== 'DELETE'}
                    onPress={handleDeleteAccount}
                    accessibilityLabel="Confirm account deletion"
                  />
                  <PrimaryButton
                    label="Cancel"
                    variant="tertiary"
                    onPress={() => setDeleteModalVisible(false)}
                    accessibilityLabel="Cancel deletion"
                  />
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.xs,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  statValueSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  backupStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotGreen: {
    backgroundColor: '#16A34A',
  },
  statusDotMuted: {
    backgroundColor: '#9CA3AF',
  },
  backupStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  actionLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
  destructiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: layout.maxWidth,
    maxHeight: '80%',
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalScroll: {
    backgroundColor: colors.background,
    borderRadius: layout.borderRadius.sm,
    padding: spacing.md,
    maxHeight: 260,
  },
  modalCodeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: colors.text,
  },
  modalButtonContainer: {
    marginTop: spacing.sm,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: layout.maxWidth,
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    padding: spacing.xl,
    gap: spacing.md,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#DC2626',
  },
  deleteModalWarning: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  bulletList: {
    gap: 4,
    paddingLeft: spacing.sm,
  },
  bulletItem: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  deleteInstruction: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  deleteKeyword: {
    fontWeight: '800',
    color: '#DC2626',
  },
  deleteInput: {
    height: 56,
    backgroundColor: colors.background,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
  },
  privacyCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  privacyCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  privacyBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  privacyBulletDot: {
    fontSize: 15,
    color: colors.accent,
    fontWeight: '700',
    lineHeight: 20,
  },
  privacyBulletText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  privacyBulletBold: {
    fontWeight: '700',
    color: colors.text,
  },
  deleteActions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
