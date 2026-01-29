import { getPendingVotes, markVoteSynced } from '../db/client';
import * as SQLite from 'expo-sqlite';

const API_URL = 'http://localhost:8000/api/v1'; // Use your machine's IP for real device

export async function syncVotes(db: SQLite.SQLiteDatabase) {
  const pendingVotes = await getPendingVotes(db);
  
  if (pendingVotes.length === 0) return;

  console.log(`Syncing ${pendingVotes.length} votes...`);

  for (const vote of pendingVotes) {
    try {
      const response = await fetch(`${API_URL}/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Header for zero-trust fingerprinting
          'X-Device-Fingerprint': (vote as any).device_signature,
          // Authorization token should be added here once we have it
        },
        body: JSON.stringify({
          user_id: (vote as any).user_id,
          category_id: (vote as any).category_id,
          candidate_id: (vote as any).candidate_id,
          idempotency_key: (vote as any).idempotency_key,
          device_signature: (vote as any).device_signature,
        }),
      });

      if (response.ok || response.status === 400) {
        // If 400, it might be a duplicate already on server (atomic integrity)
        // We mark it as synced to avoid retry loops
        await markVoteSynced(db, (vote as any).id);
      }
    } catch (error) {
       console.error('Failed to sync vote:', error);
    }
  }
}
