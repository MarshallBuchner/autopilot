import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

let dbInstance: Database.Database | null = null;
let unavailableReason: string | null = null;

function dataDir(): string {
  return process.env.SANDBOX_DATA_DIR
    ? path.resolve(process.env.SANDBOX_DATA_DIR)
    : path.join(process.cwd(), "data");
}

function dbPath(): string {
  return path.join(dataDir(), "sandbox.db");
}

/** True when we can safely persist a local SQLite sandbox database. */
export function canUseSandboxFilesystem(): boolean {
  if (process.env.SANDBOX_FORCE_DISABLE === "1") return false;
  // Vercel serverless filesystem is ephemeral / not suitable for this experiment.
  if (process.env.VERCEL === "1" && !process.env.SANDBOX_DATA_DIR) return false;
  return true;
}

export function getSandboxUnavailableReason(): string | null {
  if (!canUseSandboxFilesystem()) {
    return "LOCAL SETUP REQUIRED — Live Sandbox needs a writable local SQLite database. Demo Mode remains fully available.";
  }
  return unavailableReason;
}

export function getSandboxEnvironment(): "local" | "vercel" | "unknown" {
  if (process.env.VERCEL === "1") return "vercel";
  if (process.env.NODE_ENV) return "local";
  return "unknown";
}

export function openSandboxDb(): Database.Database {
  if (!canUseSandboxFilesystem()) {
    throw new Error(getSandboxUnavailableReason() ?? "Sandbox unavailable");
  }
  if (dbInstance) return dbInstance;

  try {
    const dir = dataDir();
    fs.mkdirSync(dir, { recursive: true });
    const database = new Database(dbPath());
    database.pragma("journal_mode = WAL");
    database.pragma("foreign_keys = ON");
    migrate(database);
    dbInstance = database;
    unavailableReason = null;
    return database;
  } catch (error) {
    unavailableReason =
      error instanceof Error ? error.message : "Failed to open sandbox database";
    throw error;
  }
}

export function closeSandboxDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

function migrate(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      distance_km INTEGER NOT NULL,
      occupation TEXT NOT NULL,
      bio TEXT NOT NULL,
      interests_json TEXT NOT NULL,
      avatar_hue INTEGER NOT NULL,
      avatar_variant INTEGER NOT NULL,
      avatar_style TEXT NOT NULL,
      is_current_user INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      from_user_id TEXT NOT NULL,
      to_user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(from_user_id, to_user_id),
      FOREIGN KEY(from_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(to_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      user_a_id TEXT NOT NULL,
      user_b_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(user_a_id, user_b_id),
      FOREIGN KEY(user_a_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(user_b_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_likes_from ON likes(from_user_id);
    CREATE INDEX IF NOT EXISTS idx_likes_to ON likes(to_user_id);
    CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(user_a_id, user_b_id);
  `);
}

export function isSandboxInitialized(database?: Database.Database): boolean {
  try {
    const db = database ?? openSandboxDb();
    const row = db
      .prepare("SELECT COUNT(*) AS count FROM users WHERE is_current_user = 1")
      .get() as { count: number };
    return row.count > 0;
  } catch {
    return false;
  }
}
