import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, layout } from '../../constants/colors';
import { SyncStatusState } from '../../features/sync/syncTypes';

interface CloudSyncStatusProps {
  status: SyncStatusState;
  lastSyncedAt?: string | null;
  onRetry?: () => void;
  compact?: boolean;
}

export function CloudSyncStatus({
  status,
  lastSyncedAt,
  onRetry,
  compact = false,
}: CloudSyncStatusProps) {
  // Format relative or friendly timestamp
  const formatTime = (iso?: string | null) => {
    if (!iso) return 'just now';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'just now';
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer} accessible={true} accessibilityLabel={`Cloud sync status: ${status}`}>
        {status === 'SYNCING' ? (
          <>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.compactText}>Syncing...</Text>
          </>
        ) : status === 'SYNCED' ? (
          <>
            <View style={[styles.dot, styles.dotGreen]} />
            <Text style={styles.compactText}>
              Synced {lastSyncedAt ? formatTime(lastSyncedAt) : 'just now'}
            </Text>
          </>
        ) : status === 'OFFLINE' ? (
          <>
            <View style={[styles.dot, styles.dotMuted]} />
            <Text style={styles.compactText}>Offline</Text>
          </>
        ) : (
          <>
            <View style={[styles.dot, styles.dotAmber]} />
            <Text style={styles.compactText}>Couldn't sync</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.card} accessible={true} accessibilityRole="summary">
      {status === 'OFFLINE' && (
        <View style={styles.contentRow}>
          <View style={[styles.dot, styles.dotMuted]} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>Offline</Text>
            <Text style={styles.subtitle}>Your learning is saved on this device.</Text>
          </View>
        </View>
      )}

      {status === 'SYNCING' && (
        <View style={styles.contentRow}>
          <ActivityIndicator size="small" color={colors.accent} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>Syncing...</Text>
            <Text style={styles.subtitle}>Updating cloud learning records.</Text>
          </View>
        </View>
      )}

      {status === 'SYNCED' && (
        <View style={styles.contentRow}>
          <View style={[styles.dot, styles.dotGreen]} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              Synced {lastSyncedAt ? `at ${formatTime(lastSyncedAt)}` : 'just now'}
            </Text>
            <Text style={styles.subtitle}>All family devices are up to date.</Text>
          </View>
        </View>
      )}

      {status === 'ERROR' && (
        <View style={styles.contentRow}>
          <View style={[styles.dot, styles.dotAmber]} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>Couldn't sync</Text>
            <Text style={styles.subtitle}>Your local learning is safe.</Text>
            {onRetry ? (
              <TouchableOpacity
                onPress={onRetry}
                style={styles.retryButton}
                accessibilityRole="button"
                accessibilityLabel="Try syncing again"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  textContainer: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  retryButton: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  compactText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  dotGreen: {
    backgroundColor: '#16A34A',
  },
  dotMuted: {
    backgroundColor: '#9CA3AF',
  },
  dotAmber: {
    backgroundColor: '#D97706',
  },
});
