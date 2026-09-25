import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, layout, spacing } from '../../constants/colors';
import { CurriculumLevel } from '../../types/curriculum';
import {
  addChild,
  getFamilyState,
  setActiveChild,
  updateChild,
} from '../../features/family/familyStorage';
import { ChildRecord } from '../../features/family/familyTypes';
import { LevelSelector } from '../../components/profile/LevelSelector';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { getSettings } from '../../features/settings/settingsStorage';

export default function ProfileScreen() {
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const [existingRecord, setExistingRecord] = useState<ChildRecord | null>(null);
  const [name, setName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<CurriculumLevel>('class-1');
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    getFamilyState().then((state) => {
      if (!isMounted) return;

      if (childId && state.children[childId]) {
        const rec = state.children[childId];
        setExistingRecord(rec);
        setName(rec.profile.name);
        setSelectedLevel(rec.profile.level);
      } else {
        setExistingRecord(null);
        setName('');
        setSelectedLevel('class-1');
      }
      setIsLoaded(true);
    });
    return () => {
      isMounted = false;
    };
  }, [childId]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage("Please enter the learner's name");
      return;
    }

    setErrorMessage('');

    if (existingRecord) {
      await updateChild(existingRecord.profile.id, {
        name: trimmed,
        level: selectedLevel,
      });
    } else {
      const settings = await getSettings();
      const newChild = await addChild({
        name: trimmed,
        level: selectedLevel,
        preferences: {
          dailyQuestionGoal: settings.defaultDailyQuestionGoal,
          showAllLevels: settings.showAllLevelsByDefault,
        },
      });
      await setActiveChild(newChild.profile.id);
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isEditing = !!existingRecord;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header section */}
            <View style={styles.header}>
              <Text style={styles.brandTitle}>Tutr Kidz</Text>
              <Text style={styles.heading}>
                {isEditing ? 'Edit Learner' : 'Create Learner'}
              </Text>
              <Text style={styles.subtitle}>
                {isEditing
                  ? `Update ${existingRecord.profile.name}'s profile and level.`
                  : 'Tell us a little about the learner.'}
              </Text>
            </View>

            {/* Input Section */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Child name</Text>
              <TextInput
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Child's name"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, !!errorMessage && styles.textInputError]}
                accessibilityLabel="Child's name input"
                accessibilityHint="Enter the name of the child"
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={40}
              />
              {errorMessage ? (
                <Text style={styles.errorText} accessibilityRole="alert">
                  {errorMessage}
                </Text>
              ) : null}
            </View>

            {/* Learning Level Section */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Learning level</Text>
              <LevelSelector
                selectedLevel={selectedLevel}
                onSelectLevel={(lvl) => setSelectedLevel(lvl)}
              />
            </View>

            {/* Actions */}
            <View style={styles.buttonGroup}>
              <PrimaryButton
                label={isEditing ? 'Save Changes' : 'Create Learner'}
                variant="primary"
                onPress={handleSave}
                accessibilityLabel={isEditing ? 'Save Changes' : 'Create Learner'}
                accessibilityHint="Saves the child profile and returns"
              />

              <PrimaryButton
                label="Cancel"
                variant="tertiary"
                onPress={handleCancel}
                accessibilityLabel="Cancel"
                accessibilityHint="Discards changes and returns"
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
  keyboardAvoid: {
    flex: 1,
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
    lineHeight: 22,
  },
  formSection: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 18,
    color: colors.text,
    minHeight: 56, // Accessible touch target
  },
  textInputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    marginTop: spacing.xs,
  },
  buttonGroup: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});
