import * as SQLite from 'expo-sqlite';
import { SCHEMA_VERSION, CREATE_TABLES } from './schema';

const SETTINGS_TABLE = `CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)`;

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('aura.db');
  }
  return db;
}

export async function runMigrations(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync('PRAGMA journal_mode = WAL');
  await database.execAsync('PRAGMA foreign_keys = ON');

  const currentVersion = await getCurrentVersion(database);

  if (currentVersion < SCHEMA_VERSION) {
    for (let v = currentVersion + 1; v <= SCHEMA_VERSION; v++) {
      await applyMigration(database, v);
    }
  }
}

async function getCurrentVersion(database: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const tableExists = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='schema_version'`
    );
    if (!tableExists || tableExists.count === 0) return 0;

    const row = await database.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1'
    );
    return row?.version ?? 0;
  } catch {
    return 0;
  }
}

async function applyMigration(database: SQLite.SQLiteDatabase, version: number): Promise<void> {
  if (version === 1) {
    for (const stmt of CREATE_TABLES) {
      await database.execAsync(stmt);
    }
  } else if (version === 2) {
    await database.execAsync(SETTINGS_TABLE);
  } else if (version === 3) {
    // v3 previously created the audio_tracks table; now a no-op.
  } else if (version === 4) {
    await database.execAsync('DROP TABLE IF EXISTS audio_tracks');
  }

  await database.runAsync(
    'INSERT INTO schema_version (version, applied_at) VALUES (?, ?)',
    version,
    Date.now()
  );
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
