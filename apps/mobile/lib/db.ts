/**
 * Local SQLite database — offline-first field mode storage.
 *
 * Three tables:
 *   offline_sessions — sessions created on device (pending → synced)
 *   offline_finds    — finds buffered during a session
 *   offline_images   — photos cached to the device filesystem
 *
 * ID convention:
 *   - Sessions created locally get a 'local_xxx' ID until synced.
 *   - Finds created while resuming an already-synced session use the
 *     server session UUID directly as session_id (no offline_sessions row).
 *
 * All writes are local-first. Sync happens explicitly (on session end or
 * manually from the sessions list).
 */
import * as SQLite from "expo-sqlite";
// expo-file-system v19 moved file operations to the /next sub-path.
// The new API uses synchronous File/Directory classes instead of async helpers.
import { Directory, File, Paths } from "expo-file-system/next";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncStatus = "pending" | "synced" | "failed";

export interface LocalSession {
  id: string; // 'local_xxx' until synced
  serverId: string | null;
  name: string;
  namingScheme: string | null;
  dateFrom: string; // ISO string
  dateTo: string | null;
  routeJson: string | null; // JSON array of {lat,lng} — set when session ends
  status: SyncStatus;
  findCount: number; // kept in sync via triggers / explicit updates
}

export interface LocalFind {
  id: string;
  sessionId: string; // local ID or server UUID
  name: string | null;
  lat: number;
  lng: number;
  description: string | null;
  conductivity: number | null;
  foundAt: string; // ISO string
  status: SyncStatus;
}

export interface LocalImage {
  id: string;
  findId: string;
  localPath: string; // permanent path inside documentDirectory
  serverId: string | null;
  status: "pending" | "uploaded";
}

// ─── DB singleton ─────────────────────────────────────────────────────────────

// Promise-based singleton: all concurrent callers await the same init,
// preventing the race where two callers both see _db = null and open
// duplicate connections (which causes NativeDatabase NullPointerExceptions).
let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function initDb(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("sondlr.db");

  // PRAGMA must be separate from DDL on some Android SQLite builds
  await db.execAsync("PRAGMA journal_mode = WAL;");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_sessions (
      id            TEXT PRIMARY KEY,
      server_id     TEXT,
      name          TEXT NOT NULL,
      naming_scheme TEXT,
      date_from     TEXT NOT NULL,
      date_to       TEXT,
      route_json    TEXT,
      status        TEXT NOT NULL DEFAULT 'pending',
      find_count    INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS offline_finds (
      id            TEXT PRIMARY KEY,
      session_id    TEXT NOT NULL,
      name          TEXT,
      lat           REAL NOT NULL,
      lng           REAL NOT NULL,
      description   TEXT,
      conductivity  INTEGER,
      found_at      TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS offline_images (
      id            TEXT PRIMARY KEY,
      find_id       TEXT NOT NULL,
      local_path    TEXT NOT NULL,
      server_id     TEXT,
      status        TEXT NOT NULL DEFAULT 'pending'
    );
  `);

  return db;
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_dbPromise) {
    // If init fails, clear the promise so the next call can retry
    _dbPromise = initDb().catch((err) => {
      _dbPromise = null;
      throw err;
    });
  }
  return _dbPromise;
}

// ─── ID helper ────────────────────────────────────────────────────────────────

function localId(): string {
  return "local_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

/** Create a new session stored only locally. Returns the session with its local ID. */
export async function createLocalSession(data: {
  name: string;
  namingScheme: string | null;
  dateFrom: string;
}): Promise<LocalSession> {
  const db = await getDb();
  const id = localId();
  await db.runAsync(
    "INSERT INTO offline_sessions (id, name, naming_scheme, date_from) VALUES (?, ?, ?, ?)",
    [id, data.name, data.namingScheme, data.dateFrom]
  );
  return {
    id,
    serverId: null,
    name: data.name,
    namingScheme: data.namingScheme,
    dateFrom: data.dateFrom,
    dateTo: null,
    routeJson: null,
    status: "pending",
    findCount: 0,
  };
}

export async function getLocalSession(id: string): Promise<LocalSession | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    "SELECT * FROM offline_sessions WHERE id = ?",
    [id]
  );
  return row ? rowToSession(row) : null;
}

/** All sessions that have not yet been synced to the server. */
export async function getPendingSessions(): Promise<LocalSession[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM offline_sessions WHERE status = 'pending' ORDER BY date_from DESC"
  );
  return rows.map(rowToSession);
}

/** Store GPS route points on the local session (called when tracking stops). */
export async function saveSessionRoute(
  localId: string,
  points: { lat: number; lng: number }[]
): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE offline_sessions SET route_json = ? WHERE id = ?", [
    JSON.stringify(points),
    localId,
  ]);
}

/**
 * Persist the server ID as soon as the session is created on the server.
 * Call this immediately after the POST — before uploading finds — so a
 * mid-sync crash doesn't cause a duplicate session on the next retry.
 */
export async function saveSessionServerId(localId: string, serverId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE offline_sessions SET server_id = ? WHERE id = ?",
    [serverId, localId]
  );
}

/** Write the dateTo and mark fully synced once all finds are uploaded. */
export async function markSessionSynced(
  localId: string,
  serverId: string,
  dateTo: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE offline_sessions SET server_id = ?, date_to = ?, status = 'synced' WHERE id = ?",
    [serverId, dateTo, localId]
  );
}

// ─── Finds ────────────────────────────────────────────────────────────────────

/**
 * Buffer a new find locally.
 * sessionId can be a local 'local_xxx' ID or a server UUID (when resuming a
 * session that's already on the server).
 * Returns the local find ID.
 */
export async function createLocalFind(data: {
  sessionId: string;
  name: string | null;
  lat: number;
  lng: number;
  description: string | null;
  conductivity: number | null;
  foundAt: string;
}): Promise<string> {
  const db = await getDb();
  const id = localId();
  await db.runAsync(
    `INSERT INTO offline_finds
       (id, session_id, name, lat, lng, description, conductivity, found_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.sessionId, data.name, data.lat, data.lng, data.description, data.conductivity, data.foundAt]
  );
  // Keep the denormalized counter up to date for local sessions
  if (data.sessionId.startsWith("local_")) {
    await db.runAsync(
      "UPDATE offline_sessions SET find_count = find_count + 1 WHERE id = ?",
      [data.sessionId]
    );
  }
  return id;
}

/** All unsynced finds for a given session (local or server ID). */
export async function getPendingFinds(sessionId: string): Promise<LocalFind[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM offline_finds WHERE session_id = ? AND status = 'pending' ORDER BY found_at ASC",
    [sessionId]
  );
  return rows.map(rowToFind);
}

export async function markFindSynced(localFindId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE offline_finds SET status = 'synced' WHERE id = ?", [localFindId]);
}

/** Count of unsynced finds for a session (used for badges). */
export async function getPendingFindCount(sessionId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM offline_finds WHERE session_id = ? AND status = 'pending'",
    [sessionId]
  );
  return row?.count ?? 0;
}

// ─── Images ───────────────────────────────────────────────────────────────────

/**
 * Copy a photo from the camera temp URI to permanent app storage.
 * Returns the permanent file URI. The file is safe from OS cleanup.
 * Call this immediately when the photo is taken — before the find is submitted.
 *
 * Uses the expo-file-system v19 synchronous File/Directory API.
 */
export function cacheImageLocally(sourceUri: string): string {
  const filename = localId() + ".jpg";
  // Paths.document is the app's permanent documents directory
  const dir = new Directory(Paths.document, "offline_images");
  if (!dir.exists) dir.create();
  const dest = new File(dir, filename);
  new File(sourceUri).copy(dest);
  return dest.uri;
}

/**
 * Create a DB record linking an already-cached image to a find.
 * Call this when the find is submitted, after createLocalFind().
 */
export async function linkImageToFind(findId: string, localPath: string): Promise<void> {
  const db = await getDb();
  const id = localId();
  await db.runAsync(
    "INSERT INTO offline_images (id, find_id, local_path, status) VALUES (?, ?, ?, 'pending')",
    [id, findId, localPath]
  );
}

/** All pending images for a given find. */
export async function getPendingImages(findId: string): Promise<LocalImage[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM offline_images WHERE find_id = ? AND status = 'pending'",
    [findId]
  );
  return rows.map(rowToImage);
}

export async function markImageUploaded(localImageId: string, serverId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE offline_images SET server_id = ?, status = 'uploaded' WHERE id = ?",
    [serverId, localImageId]
  );
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToSession(row: Record<string, unknown>): LocalSession {
  return {
    id: row.id as string,
    serverId: (row.server_id as string | null) ?? null,
    name: row.name as string,
    namingScheme: (row.naming_scheme as string | null) ?? null,
    dateFrom: row.date_from as string,
    dateTo: (row.date_to as string | null) ?? null,
    routeJson: (row.route_json as string | null) ?? null,
    status: row.status as SyncStatus,
    findCount: (row.find_count as number) ?? 0,
  };
}

function rowToFind(row: Record<string, unknown>): LocalFind {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    name: (row.name as string | null) ?? null,
    lat: row.lat as number,
    lng: row.lng as number,
    description: (row.description as string | null) ?? null,
    conductivity: (row.conductivity as number | null) ?? null,
    foundAt: row.found_at as string,
    status: row.status as SyncStatus,
  };
}

function rowToImage(row: Record<string, unknown>): LocalImage {
  return {
    id: row.id as string,
    findId: row.find_id as string,
    localPath: row.local_path as string,
    serverId: (row.server_id as string | null) ?? null,
    status: row.status as "pending" | "uploaded",
  };
}
