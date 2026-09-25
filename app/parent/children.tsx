import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors, layout, spacing } from '../../constants/colors';
import { getLevelById } from '../../constants/levels';
import { getFamilyState, setActiveChild } from '../../features/family/familyStorage';
import { FamilyState, ChildRecord } from '../../features/family/familyTypes';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { useParentAccess } from '../../features/settings/useParentAccess';
import { ParentLockChallengeModal } from '../../components/settings/ParentLockChallengeModal';

export default function LearnersScreen() {
  const { isLocked, checking, handleUnlockSuccess, handleUnlockCancel } = useParentAccess();
  const [familyState, setFamilyState] = useState<FamilyState | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      getFamilyState().then((state) => {
        if (isMounted) setFamilyState(state);
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleSelectChild = async (childId: string) => {
    await setActiveChild(childId);
    router.replace('/');
  };

  const handleAddLearner = () => {
    router.push('/profile');
  };

  if (checking || !familyState) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading learners...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const childrenList: ChildRecord[] = Object.values(familyState.children);
  const activeId = familyState.activeChildId;

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
            <Text style={styles.heading}>Learners</Text>
            <Text style={styles.subtitle}>Select who is learning today.</Text>
          </View>

          {/* Children List */}
          {childrenList.length > 0 ? (
            <View style={styles.list}>
              {childrenList.map((record) => {
                const isSelected = record.profile.id === activeId;
                const levelConfig = getLevelById(record.profile.level);
                const levelTitle = levelConfig?.title ?? record.profile.level;

                return (
                  <Pressable
                    key={record.profile.id}
                    onPress={() => handleSelectChild(record.profile.id)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={
                      isSelected
                        ? `Currently learning as ${record.profile.name}, ${levelTitle}`
                        : `Switch to ${record.profile.name}, ${levelTitle}`
                    }
                    accessibilityHint="Sets this learner as active and returns to Home"
                    style={({ pressed }) => [
                      styles.card,
                      isSelected && styles.cardSelected,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View style={styles.cardInfo}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.name, isSelected && styles.nameSelected]}>
                          {record.profile.name}
                        </Text>
                        {isSelected ? (
                          <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>Currently learning</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.levelText}>{levelTitle}</Text>
                    </View>

                    <View style={styles.actionRow}>
                      <Text style={[styles.actionText, isSelected && styles.actionTextSelected]}>
                        {isSelected ? 'Learning now ✓' : `Continue as ${record.profile.name} →`}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No learners added yet</Text>
              <Text style={styles.emptyText}>
                Add a child profile to start tracking learning progress.
              </Text>
            </View>
          )}

          {/* Add learner action */}
          <View style={styles.actionSection}>
            <PrimaryButton
              label="+ Add learner"
              variant="primary"
              onPress={handleAddLearner}
              accessibilityLabel="Add learner"
              accessibilityHint="Navigates to create a new learner profile"
            />

            <PrimaryButton
              label="Back"
              variant="tertiary"
              onPress={() => router.back()}
              accessibilityLabel="Back"
              accessibilityHint="Returns to previous screen"
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
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    minHeight: 88,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: '#FAF9FF',
  },
  cardPressed: {
    backgroundColor: colors.cardPressed,
  },
  cardInfo: {
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  nameSelected: {
    color: colors.accent,
  },
  activeBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.sm,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  levelText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionTextSelected: {
    color: colors.accent,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionSection: {
    gap: spacing.sm,
  },
});
