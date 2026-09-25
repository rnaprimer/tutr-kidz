import { SyncQueueItem } from './syncTypes';
import { familyStorageAdapter } from '../family/familyStorageAdapter';

const SYNC_QUEUE_KEY = 'tutr_kidz_sync_queue';

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const raw = await familyStorageAdapter.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SyncQueueItem[];
  } catch {
    return [];
  }
}

export async function enqueueSyncItem(
  item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'attempts'>
): Promise<SyncQueueItem> {
  const queue = await getSyncQueue();
  const newItem: SyncQueueItem = {
    ...item,
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  queue.push(newItem);
  await familyStorageAdapter.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  return newItem;
}

export async function removeQueueItem(id: string): Promise<void> {
  const queue = await getSyncQueue();
  const filtered = queue.filter((q) => q.id !== id);
  await familyStorageAdapter.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
}

export async function clearSyncQueue(): Promise<void> {
  await familyStorageAdapter.removeItem(SYNC_QUEUE_KEY);
}

export async function updateQueueItemError(id: string, error: string): Promise<void> {
  const queue = await getSyncQueue();
  const item = queue.find((q) => q.id === id);
  if (item) {
    item.attempts += 1;
    item.lastError = error;
    await familyStorageAdapter.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  }
}
