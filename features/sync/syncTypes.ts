export type SyncStatusState = 'OFFLINE' | 'SYNCING' | 'SYNCED' | 'ERROR';

export interface SyncQueueItem {
  id: string;
  userId?: string;
  entityType: 'child' | 'preference' | 'topic_progress' | 'quiz_attempt' | 'family_settings' | 'learning_plan' | 'feedback';
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  createdAt: string;
  attempts: number;
  lastError?: string;
  syncedAt?: string;
}

export interface SyncResult {
  success: boolean;
  syncedAt?: string;
  uploadedItems?: number;
  downloadedItems?: number;
  error?: string;
}
