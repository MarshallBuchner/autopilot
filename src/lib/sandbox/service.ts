import { randomUUID } from "crypto";
import {
  canUseSandboxFilesystem,
  getSandboxEnvironment,
  getSandboxUnavailableReason,
  isSandboxInitialized,
  openSandboxDb,
} from "@/lib/sandbox/db";
import {
  buildSandboxSeedProfiles,
  resolveReciprocalLikerIds,
  SANDBOX_CURRENT_USER,
} from "@/lib/sandbox/seed";
import {
  rowToProfile,
  SANDBOX_CURRENT_USER_ID,
  type SandboxInspectData,
  type SandboxLikeResult,
  type SandboxMatchRow,
  type SandboxStatus,
  type SandboxUserRow,
} from "@/lib/sandbox/types";
import type { DemoProfile } from "@/lib/types";

function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function getSandboxStatus(): SandboxStatus {
  const environment = getSandboxEnvironment();
  if (!canUseSandboxFilesystem()) {
    return {
      available: false,
      initialized: false,
      connected: false,
      reason: getSandboxUnavailableReason() ?? "LOCAL SETUP REQUIRED",
      currentUserId: SANDBOX_CURRENT_USER_ID,
      profiles: 0,
      outgoingLikes: 0,
      incomingLikes: 0,
      matches: 0,
      database: "unavailable",
      environment,
    };
  }

  try {
    const db = openSandboxDb();
    const initialized = isSandboxInitialized(db);
    if (!initialized) {
      return {
        available: true,
        initialized: false,
        connected: true,
        reason: "Sandbox database is ready. Initialize to seed profiles.",
        currentUserId: SANDBOX_CURRENT_USER_ID,
        profiles: 0,
        outgoingLikes: 0,
        incomingLikes: 0,
        matches: 0,
        database: "uninitialized",
        environment,
      };
    }

    const profiles = (
      db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number }
    ).count;
    const outgoingLikes = (
      db
        .prepare("SELECT COUNT(*) AS count FROM likes WHERE from_user_id = ?")
        .get(SANDBOX_CURRENT_USER_ID) as { count: number }
    ).count;
    const incomingLikes = (
      db
        .prepare("SELECT COUNT(*) AS count FROM likes WHERE to_user_id = ?")
        .get(SANDBOX_CURRENT_USER_ID) as { count: number }
    ).count;
    const matches = (
      db.prepare("SELECT COUNT(*) AS count FROM matches").get() as { count: number }
    ).count;

    return {
      available: true,
      initialized: true,
      connected: true,
      currentUserId: SANDBOX_CURRENT_USER_ID,
      profiles,
      outgoingLikes,
      incomingLikes,
      matches,
      database: "connected",
      environment,
    };
  } catch (error) {
    return {
      available: false,
      initialized: false,
      connected: false,
      reason: error instanceof Error ? error.message : "Sandbox unavailable",
      currentUserId: SANDBOX_CURRENT_USER_ID,
      profiles: 0,
      outgoingLikes: 0,
      incomingLikes: 0,
      matches: 0,
      database: "unavailable",
      environment,
    };
  }
}

export function initializeSandbox(): SandboxStatus {
  const db = openSandboxDb();
  const profiles = buildSandboxSeedProfiles();
  const reciprocalIds = resolveReciprocalLikerIds(profiles);
  const now = Date.now();

  const wipe = db.transaction(() => {
    db.exec("DELETE FROM matches; DELETE FROM likes; DELETE FROM users;");

    const insertUser = db.prepare(`
      INSERT INTO users (
        id, name, age, distance_km, occupation, bio, interests_json,
        avatar_hue, avatar_variant, avatar_style, is_current_user, created_at
      ) VALUES (
        @id, @name, @age, @distance_km, @occupation, @bio, @interests_json,
        @avatar_hue, @avatar_variant, @avatar_style, @is_current_user, @created_at
      )
    `);

    for (const profile of profiles) {
      insertUser.run({
        id: profile.id,
        name: profile.firstName,
        age: profile.age,
        distance_km: profile.distanceKm,
        occupation: profile.occupation,
        bio: profile.bio,
        interests_json: JSON.stringify(profile.interests),
        avatar_hue: profile.avatarHue,
        avatar_variant: profile.avatarVariant,
        avatar_style: profile.avatarStyle,
        is_current_user: profile.id === SANDBOX_CURRENT_USER_ID ? 1 : 0,
        created_at: now,
      });
    }

    const insertLike = db.prepare(`
      INSERT INTO likes (id, from_user_id, to_user_id, created_at)
      VALUES (@id, @from_user_id, @to_user_id, @created_at)
    `);

    for (const fromId of reciprocalIds) {
      insertLike.run({
        id: `like-${fromId}-to-alex`,
        from_user_id: fromId,
        to_user_id: SANDBOX_CURRENT_USER_ID,
        created_at: now - 60_000,
      });
    }
  });

  wipe();
  return getSandboxStatus();
}

export function resetSandbox(): SandboxStatus {
  return initializeSandbox();
}

export function getNextSandboxProfile(userId = SANDBOX_CURRENT_USER_ID): DemoProfile | null {
  const db = openSandboxDb();
  if (!isSandboxInitialized(db)) {
    throw new Error("Sandbox is not initialized");
  }

  const row = db
    .prepare(
      `
      SELECT u.*
      FROM users u
      WHERE u.id != ?
        AND u.is_current_user = 0
        AND u.id NOT IN (
          SELECT to_user_id FROM likes WHERE from_user_id = ?
        )
      ORDER BY u.name ASC, u.id ASC
      LIMIT 1
    `
    )
    .get(userId, userId) as SandboxUserRow | undefined;

  return row ? rowToProfile(row) : null;
}

export function createSandboxLike(
  fromUserId: string,
  toUserId: string
): SandboxLikeResult {
  const db = openSandboxDb();
  if (!isSandboxInitialized(db)) {
    throw new Error("Sandbox is not initialized");
  }
  if (fromUserId === toUserId) {
    throw new Error("Cannot like yourself");
  }

  const from = db
    .prepare("SELECT id FROM users WHERE id = ?")
    .get(fromUserId) as { id: string } | undefined;
  const to = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(toUserId) as SandboxUserRow | undefined;
  if (!from || !to) {
    throw new Error("Unknown user in like request");
  }

  const existing = db
    .prepare(
      "SELECT id, from_user_id, to_user_id, created_at FROM likes WHERE from_user_id = ? AND to_user_id = ?"
    )
    .get(fromUserId, toUserId) as
    | { id: string; from_user_id: string; to_user_id: string; created_at: number }
    | undefined;

  let likeId = existing?.id;
  let created = false;
  const createdAt = existing?.created_at ?? Date.now();

  if (!existing) {
    likeId = `like-${randomUUID()}`;
    db.prepare(
      "INSERT INTO likes (id, from_user_id, to_user_id, created_at) VALUES (?, ?, ?, ?)"
    ).run(likeId, fromUserId, toUserId, createdAt);
    created = true;
  }

  const reciprocal = db
    .prepare(
      "SELECT id FROM likes WHERE from_user_id = ? AND to_user_id = ?"
    )
    .get(toUserId, fromUserId) as { id: string } | undefined;

  let matchResult: SandboxLikeResult["match"] = null;
  if (reciprocal) {
    const [userAId, userBId] = pairKey(fromUserId, toUserId);
    const existingMatch = db
      .prepare(
        "SELECT id, user_a_id, user_b_id, created_at FROM matches WHERE user_a_id = ? AND user_b_id = ?"
      )
      .get(userAId, userBId) as SandboxMatchRow | undefined;

    if (existingMatch) {
      matchResult = {
        id: existingMatch.id,
        userAId: existingMatch.user_a_id,
        userBId: existingMatch.user_b_id,
        createdAt: existingMatch.created_at,
        created: false,
        profile: rowToProfile(to),
      };
    } else {
      const matchId = `match-${randomUUID()}`;
      const matchCreatedAt = Date.now();
      db.prepare(
        "INSERT INTO matches (id, user_a_id, user_b_id, created_at) VALUES (?, ?, ?, ?)"
      ).run(matchId, userAId, userBId, matchCreatedAt);
      matchResult = {
        id: matchId,
        userAId,
        userBId,
        createdAt: matchCreatedAt,
        created: true,
        profile: rowToProfile(to),
      };
    }
  }

  return {
    like: {
      id: likeId!,
      fromUserId,
      toUserId,
      createdAt,
      created,
    },
    match: matchResult,
  };
}

export function listSandboxMatches(userId = SANDBOX_CURRENT_USER_ID) {
  const db = openSandboxDb();
  if (!isSandboxInitialized(db)) {
    throw new Error("Sandbox is not initialized");
  }

  const rows = db
    .prepare(
      `
      SELECT m.id AS match_id, m.created_at AS matched_at, u.*
      FROM matches m
      JOIN users u
        ON u.id = CASE
          WHEN m.user_a_id = ? THEN m.user_b_id
          ELSE m.user_a_id
        END
      WHERE m.user_a_id = ? OR m.user_b_id = ?
      ORDER BY m.created_at DESC
    `
    )
    .all(userId, userId, userId) as Array<SandboxUserRow & { match_id: string; matched_at: number }>;

  return rows.map((row) => ({
    id: row.match_id,
    matchedAt: row.matched_at,
    sessionId: "live-sandbox",
    profile: rowToProfile(row),
  }));
}

export function inspectSandbox(userId = SANDBOX_CURRENT_USER_ID): SandboxInspectData {
  const db = openSandboxDb();
  const status = getSandboxStatus();
  if (!status.initialized) {
    return {
      currentUser: SANDBOX_CURRENT_USER,
      profiles: 0,
      outgoingLikes: [],
      incomingLikes: [],
      matches: [],
      status,
    };
  }

  const currentRow = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(userId) as SandboxUserRow | undefined;
  const currentUser = currentRow
    ? { ...rowToProfile(currentRow), id: currentRow.id }
    : SANDBOX_CURRENT_USER;

  const outgoingLikes = db
    .prepare(
      `
      SELECT l.id, l.to_user_id AS toUserId, u.name AS toName, l.created_at AS createdAt
      FROM likes l
      JOIN users u ON u.id = l.to_user_id
      WHERE l.from_user_id = ?
      ORDER BY l.created_at DESC
    `
    )
    .all(userId) as Array<{ id: string; toUserId: string; toName: string; createdAt: number }>;

  const incomingLikes = db
    .prepare(
      `
      SELECT l.id, l.from_user_id AS fromUserId, u.name AS fromName, l.created_at AS createdAt
      FROM likes l
      JOIN users u ON u.id = l.from_user_id
      WHERE l.to_user_id = ?
      ORDER BY l.created_at DESC
    `
    )
    .all(userId) as Array<{
    id: string;
    fromUserId: string;
    fromName: string;
    createdAt: number;
  }>;

  return {
    currentUser,
    profiles: status.profiles,
    outgoingLikes,
    incomingLikes,
    matches: listSandboxMatches(userId),
    status,
  };
}
