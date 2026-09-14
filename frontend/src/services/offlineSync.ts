import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { OfflineSyncItem } from '../types';

interface RudraDB extends DBSchema {
  offline_queue: {
    key: string;
    value: OfflineSyncItem;
    indexes: { 'by-status': string };
  };
  cached_zones: {
    key: string;
    value: any;
  };
  cached_identity: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'rudra_offline_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<RudraDB>> | null = null;

export function getOfflineDB(): Promise<IDBPDatabase<RudraDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RudraDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('offline_queue')) {
          const queueStore = db.createObjectStore('offline_queue', { keyPath: 'local_event_id' });
          queueStore.createIndex('by-status', 'status');
        }
        if (!db.objectStoreNames.contains('cached_zones')) {
          db.createObjectStore('cached_zones', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cached_identity')) {
          db.createObjectStore('cached_identity', { keyPath: 'drishti_id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueueOfflineEvent(
  eventType: 'SOS_TRIGGER' | 'HAZARD_REPORT' | 'BREADCRUMB',
  payload: any
): Promise<string> {
  const db = await getOfflineDB();
  const localEventId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const item: OfflineSyncItem = {
    local_event_id: localEventId,
    event_type: eventType,
    payload,
    client_timestamp: new Date().toISOString(),
    status: 'PENDING',
    retry_count: 0
  };

  await db.put('offline_queue', item);
  console.log(`[Rudra Offline Queue] Enqueued ${eventType} with ID: ${localEventId}`);
  return localEventId;
}

export async function getPendingOfflineEvents(): Promise<OfflineSyncItem[]> {
  const db = await getOfflineDB();
  const allItems = await db.getAll('offline_queue');
  return allItems.filter(item => item.status === 'PENDING' || item.status === 'FAILED');
}

export async function markEventSynced(localEventId: string) {
  const db = await getOfflineDB();
  const item = await db.get('offline_queue', localEventId);
  if (item) {
    item.status = 'SYNCED';
    await db.put('offline_queue', item);
  }
}

export async function cacheSafetyZones(zones: any[]) {
  const db = await getOfflineDB();
  const tx = db.transaction('cached_zones', 'readwrite');
  for (const zone of zones) {
    await tx.store.put(zone);
  }
  await tx.done;
  console.log(`[Rudra Cache] Cached ${zones.length} safety zones locally for offline use.`);
}

export async function getCachedSafetyZones(): Promise<any[]> {
  const db = await getOfflineDB();
  return db.getAll('cached_zones');
}

export async function cacheDigitalIdentity(identityData: any) {
  const db = await getOfflineDB();
  await db.put('cached_identity', identityData);
}

export async function getCachedDigitalIdentity(): Promise<any | null> {
  const db = await getOfflineDB();
  const all = await db.getAll('cached_identity');
  return all.length > 0 ? all[0] : null;
}
