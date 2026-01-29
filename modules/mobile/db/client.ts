import * as SQLite from 'expo-sqlite';

export async function initDatabase() {
  const db = await SQLite.openDatabaseAsync('votestar.db');

  // Create local votes table
  // status: 'pending' | 'synced' | 'failed'
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS local_votes (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      idempotency_key TEXT UNIQUE NOT NULL,
      device_signature TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      status TEXT DEFAULT 'pending'
    );
  `);

  return db;
}

export async function addLocalVote(db: SQLite.SQLiteDatabase, vote: any) {
  return await db.runAsync(
    'INSERT INTO local_votes (id, user_id, category_id, candidate_id, idempotency_key, device_signature, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [vote.id, vote.user_id, vote.category_id, vote.candidate_id, vote.idempotency_key, vote.device_signature, vote.timestamp]
  );
}

export async function getPendingVotes(db: SQLite.SQLiteDatabase) {
  return await db.getAllAsync('SELECT * FROM local_votes WHERE status = "pending"');
}

export async function markVoteSynced(db: SQLite.SQLiteDatabase, id: string) {
  return await db.runAsync('UPDATE local_votes SET status = "synced" WHERE id = ?', [id]);
}
