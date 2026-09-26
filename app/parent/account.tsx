import { useDocumentTitle } from "../../lib/utils/useDocumentTitle";
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors, spacing, layout } from '../../constants/colors';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SettingsSection } from '../../components/settings/SettingsSection';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { ParentLockChallengeModal } from '../../components/settings/ParentLockChallengeModal';
import { CloudSyncStatus } from '../../components/sync/CloudSyncStatus';
import { useParentAccess } from '../../features/settings/useParentAccess';
import { useAuth } from '../../features/auth/useAuth';
import { getFamilyState } from '../../features/family/familyRepository';
import { FamilyState } from '../../features/family/familyTypes';
import {
  getLastSyncedAt,
  syncNow,
  exportFamilyData,
} from '../../features/sync/syncService';
import { SyncStatusState } from '../../features/sync/syncTypes';

export default function ParentAccountScreen() {
  useDocumentTitle("Tutr Kidz — Parent Account");

  const { isLocked, checking, handleUnlockSuccess, handleUnlockCancel } = useParentAccess();
  const { user, isAuthenticated, isLoading: authLoading, signOut, resetPassword } = useAuth();

  const [familyState, setFamilyState] = useState<FamilyState | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusState>('SYNCED');
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Export Modal
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportedJson, setExportedJson] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      const state = await getFamilyState();
      setFamilyState(state);

      const synced = await getLastSyncedAt();
      setLastSynced(synced);
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const handleSyncNow = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncStatus('SYNCING');

    const result = await syncNow();
    setSyncing(false);

    if (result.success) {
      setSyncStatus('SYNCED');
      setLastSynced(result.syncedAt || new Date().toISOString());
      showStatus('Cloud sync completed successfully.');
      await loadData();
    } else {
      setSyncStatus('ERROR');
      showStatus(result.error || "Couldn't sync right now. Local data is safe.", 'error');
    }
  };

  const handleExportData = async () => {
    try {
      const json = await exportFamilyData();
      setExportedJson(json);
      setExportModalVisible(true);
    } catch {
      showStatus("Couldn't export family data.", 'error');
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      const res = await resetPassword(user.email);
      if (res.success) {
        showStatus(`Password reset link sent to ${user.email}`);
      } else {
        showStatus(res.error || "Couldn't send password reset link.", 'error');
      }
    } catch {
      showStatus("Couldn't send password reset link.", 'error');
    }
  };

  const handleSignOut = async () => {
    const res = await signOut();
    if (res.success) {
      showStatus('Signed out successfully.');
      await loadData();
    } else {
      showStatus(res.error || "Couldn't sign out.", 'error');
    }
  };

  if (checking || authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.loadingText}>Loading parent account...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const childCount = familyState?.children ? Object.keys(familyState.children).length : 0;

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
            <Text style={styles.heading}>Parent account</Text>
            {isAuthenticated ? (
              <View style={styles.connectedBadge}>
                <View style={styles.connectedDot} />
                <Text style={styles.connectedText}>Cloud connected</Text>
              </View>
            ) : null}
          </View>

          {/* Status Message */}
          {statusMessage ? (
            <View
              style={[
                styles.statusBanner,
                statusMessage.type === 'error' && styles.statusBannerError,
              ]}
              accessible={true}
              accessibilityRole="alert"
            >
              <Text
                style={[
                  styles.statusBannerText,
                  statusMessage.type === 'error' && styles.statusBannerErrorText,
                ]}
              >
                {statusMessage.text}
              </Text>
            </View>
          ) : null}

          {/* ------------------------------------------
              LOGGED OUT STATE
             ------------------------------------------ */}
          {!isAuthenticated ? (
            <View style={styles.loggedOutCard}>
              <Text style={styles.loggedOutTitle}>
                Keep your family's learning safe and available across devices.
              </Text>

              <View style={styles.loggedOutActions}>
                <PrimaryButton
                  label="Create account"
                  onPress={() => router.push('/parent/account/signup')}
                  accessibilityLabel="Create parent account"
                />
                <PrimaryButton
                  label="Sign in"
                  variant="secondary"
                  onPress={() => router.push('/parent/account/login')}
                  accessibilityLabel="Sign in to parent account"
                />
              </View>

              <View style={styles.loggedOutDivider} />

              <View style={styles.localDataNotice}>
                <Text style={styles.localDataNoticeText}>
                  Your learning data remains available on this device.
                </Text>
              </View>
            </View>
          ) : (
            /* ------------------------------------------
               LOGGED IN STATE
               ------------------------------------------ */
            <View style={styles.loggedInContainer}>
              {/* User Email & Family Summary */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.userEmailText}>{user?.email}</Text>
                </View>
                <View style={styles.familyMetaRow}>
                  <Text style={styles.familyMetaLabel}>Family</Text>
                  <Text style={styles.familyMetaValue}>
                    {childCount} {childCount === 1 ? 'learner' : 'learners'}
                  </Text>
                </View>
              </View>

              {/* Cloud Sync Status */}
              <SettingsSection
                title="Cloud sync"
                description="Synchronize learner progress across all your phones and tablets."
              >
                <CloudSyncStatus
                  status={syncStatus}
                  lastSyncedAt={lastSynced}
                  onRetry={handleSyncNow}
                />
              </SettingsSection>

              {/* Account Actions */}
              <SettingsSection
                title="Account"
                description="Manage your parent credentials."
              >
                <SettingsRow
                  label="Email"
                  rightContent={<Text style={styles.secondaryValue}>{user?.email}</Text>}
                />
                <SettingsRow
                  label="Change password"
                  description="Send a reset link to your email"
                  onPress={handleChangePassword}
                  rightContent={<Text style={styles.actionLinkText}>Send link →</Text>}
                />
                <SettingsRow
                  label="Sign out"
                  description="Disconnect this device from cloud sync"
                  onPress={handleSignOut}
                  rightContent={<Text style={styles.destructiveText}>Sign out</Text>}
                />
              </SettingsSection>

              {/* Data Actions */}
              <SettingsSection
                title="Data"
                description="Sync or backup your family's learning records."
              >
                <SettingsRow
                  label="Sync now"
                  description="Upload local progress and retrieve cloud updates"
                  onPress={handleSyncNow}
                  rightContent={
                    syncing ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <Text style={styles.actionLinkText}>Sync now</Text>
                    )
                  }
                />
                <SettingsRow
                  label="Export data"
                  description="Download a copy of your family's learning records"
                  onPress={handleExportData}
                  rightContent={<Text style={styles.actionLinkText}>Export →</Text>}
                />
              </SettingsSection>
            </View>
          )}

          {/* Navigation Back */}
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

      {/* Export Modal */}
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
              Here is your complete family learning export:
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
    gap: spacing.md,
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
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: spacing.xs,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#15803D',
  },
  connectedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
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
    textAlign: 'center',
  },
  statusBannerError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  statusBannerErrorText: {
    color: '#B91C1C',
  },
  loggedOutCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  loggedOutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 26,
    textAlign: 'center',
  },
  loggedOutActions: {
    gap: spacing.md,
  },
  loggedOutDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  localDataNotice: {
    alignItems: 'center',
  },
  localDataNoticeText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loggedInContainer: {
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  userEmailText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  familyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  familyMetaLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  familyMetaValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  secondaryValue: {
    fontSize: 14,
    color: colors.textSecondary,
    maxWidth: 180,
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
});
