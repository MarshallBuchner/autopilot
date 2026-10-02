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
  type SandboxDecisionResult,
  type SandboxInspectData,
  type SandboxLikeResult,
  type SandboxMatchRow,
  type SandboxStatus,
  type SandboxUserRow,
} from "@/lib/sandbox/types";
import type { SelectiveDecision, StrategyKind } from "@/lib/selective/types";
import type { DemoProfile } from "@/lib/types";

function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function emptyStatus(
  partial: Partial<SandboxStatus> & Pick<SandboxStatus, "available" | "database">
): SandboxStatus {
  return {
    initialized: false,
    connected: false,
    currentUserId: SANDBOX_CURRENT_USER_ID,
    profiles: 0,
    outgoingLikes: 0,
    incomingLikes: 0,
    passes: 0,
    decisions: 0,
    matches: 0,
    environment: getSandboxEnvironment(),
    ...partial,
  };
}

export function getSandboxStatus(): SandboxStatus {
  const environment = getSandboxEnvironment();
  if (!canUseSandboxFilesystem()) {
    return emptyStatus({
      available: false,
      connected: false,
      reason: getSandboxUnavailableReason() ?? "LOCAL SETUP REQUIRED",
      database: "unavailable",
      environment,
    });
  }

  try {
    const db = openSandboxDb();
    const initialized = isSandboxInitialized(db);
    if (!initialized) {
      return emptyStatus({
        available: true,
        initialized: false,
        connected: true,
        reason: "Sandbox database is ready. Initialize to seed profiles.",
        database: "uninitialized",
        environment,
      });
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
    const passes = (
      db
        .prepare(
          "SELECT COUNT(*) AS count FROM decisions WHERE user_id = ? AND decision = 'PASS'"
        )
        .get(SANDBOX_CURRENT_USER_ID) as { count: number }
    ).count;
    const decisions = (
      db
        .prepare("SELECT COUNT(*) AS count FROM decisions WHERE user_id = ?")
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
      passes,
      decisions,
      matches,
      database: "connected",
      environment,
    };
  } catch (error) {
    return emptyStatus({
      available: false,
      connected: false,
      reason: error instanceof Error ? error.message : "Sandbox unavailable",
      database: "unavailable",
      environment,
    });
  }
}

export function initializeSandbox(): SandboxStatus {
  const db = openSandboxDb();
  const profiles = buildSandboxSeedProfiles();
  const reciprocalIds = resolveReciprocalLikerIds(profiles);
  const now = Date.now();

  const wipe = db.transaction(() => {
    db.exec("DELETE FROM decisions; DELETE FROM matches; DELETE FROM likes; DELETE FROM users;");

    const insertUser = db.prepare(`
      INSERT INTO users (
        id, name, age, distance_km, occupation, bio, interests_json,
        avatar_hue, avatar_variant, avatar_style,
        relationship_goal, activity_level, smoking, drinking,
        has_children, wants_children,
        is_current_user, created_at
      ) VALUES (
        @id, @name, @age, @distance_km, @occupation, @bio, @interests_json,
        @avatar_hue, @avatar_variant, @avatar_style,
        @relationship_goal, @activity_level, @smoking, @drinking,
        @has_children, @wants_children,
        @is_current_user, @created_at
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
        relationship_goal: profile.relationshipGoal,
        activity_level: profile.activityLevel,
        smoking: profile.smoking,
        drinking: profile.drinking,
        has_children: profile.hasChildren ? 1 : 0,
        wants_children:
          profile.wantsChildren === null ? null : profile.wantsChildren ? 1 : 0,
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
        AND u.id NOT IN (
          SELECT profile_id FROM decisions WHERE user_id = ?
        )
      ORDER BY u.name ASC, u.id ASC
      LIMIT 1
    `
    )
    .get(userId, userId, userId) as SandboxUserRow | undefined;

  return row ? rowToProfile(row) : null;
}

export function createSandboxLike(
  fromUserId: string,
  toUserId: string,
  meta?: {
    strategy?: StrategyKind;
    score?: number | null;
    reasons?: unknown;
  }
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

  upsertDecision(db, {
    userId: fromUserId,
    profileId: toUserId,
    decision: "LIKE",
    strategy: meta?.strategy ?? "LIKE_EVERYONE",
    score: meta?.score ?? null,
    reasons: meta?.reasons ?? null,
    createdAt,
  });

  const reciprocal = db
    .prepare("SELECT id FROM likes WHERE from_user_id = ? AND to_user_id = ?")
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

export function recordSandboxDecision(input: {
  fromUserId?: string;
  toUserId: string;
  decision: SelectiveDecision;
  strategy: StrategyKind;
  score?: number | null;
  reasons?: unknown;
}): SandboxDecisionResult {
  const fromUserId = input.fromUserId ?? SANDBOX_CURRENT_USER_ID;
  const db = openSandboxDb();
  if (!isSandboxInitialized(db)) {
    throw new Error("Sandbox is not initialized");
  }
  if (fromUserId === input.toUserId) {
    throw new Error("Cannot decide on yourself");
  }

  const to = db
    .prepare("SELECT id FROM users WHERE id = ?")
    .get(input.toUserId) as { id: string } | undefined;
  if (!to) throw new Error("Unknown profile in decision request");

  if (input.decision === "LIKE") {
    const likeResult = createSandboxLike(fromUserId, input.toUserId, {
      strategy: input.strategy,
      score: input.score ?? null,
      reasons: input.reasons ?? null,
    });
    const decisionRow = db
      .prepare(
        "SELECT id, created_at FROM decisions WHERE user_id = ? AND profile_id = ?"
      )
      .get(fromUserId, input.toUserId) as { id: string; created_at: number };

    return {
      decision: {
        id: decisionRow.id,
        userId: fromUserId,
        profileId: input.toUserId,
        decision: "LIKE",
        strategy: input.strategy,
        score: input.score ?? null,
        reasons: input.reasons ?? null,
        createdAt: decisionRow.created_at,
        created: likeResult.like.created,
      },
      like: likeResult.like,
      match: likeResult.match,
    };
  }

  // PASS
  const existing = db
    .prepare(
      "SELECT id, decision, created_at FROM decisions WHERE user_id = ? AND profile_id = ?"
    )
    .get(fromUserId, input.toUserId) as
    | { id: string; decision: string; created_at: number }
    | undefined;

  if (existing) {
    return {
      decision: {
        id: existing.id,
        userId: fromUserId,
        profileId: input.toUserId,
        decision: existing.decision as SelectiveDecision,
        strategy: input.strategy,
        score: input.score ?? null,
        reasons: input.reasons ?? null,
        createdAt: existing.created_at,
        created: false,
      },
      like: null,
      match: null,
    };
  }

  const createdAt = Date.now();
  const id = `decision-${randomUUID()}`;
  db.prepare(
    `
    INSERT INTO decisions (id, user_id, profile_id, decision, strategy, score, reasons_json, created_at)
    VALUES (?, ?, ?, 'PASS', ?, ?, ?, ?)
  `
  ).run(
    id,
    fromUserId,
    input.toUserId,
    input.strategy,
    input.score ?? null,
    input.reasons != null ? JSON.stringify(input.reasons) : null,
    createdAt
  );

  return {
    decision: {
      id,
      userId: fromUserId,
      profileId: input.toUserId,
      decision: "PASS",
      strategy: input.strategy,
      score: input.score ?? null,
      reasons: input.reasons ?? null,
      createdAt,
      created: true,
    },
    like: null,
    match: null,
  };
}

function upsertDecision(
  db: ReturnType<typeof openSandboxDb>,
  input: {
    userId: string;
    profileId: string;
    decision: SelectiveDecision;
    strategy: StrategyKind;
    score: number | null;
    reasons: unknown;
    createdAt: number;
  }
): void {
  const existing = db
    .prepare("SELECT id FROM decisions WHERE user_id = ? AND profile_id = ?")
    .get(input.userId, input.profileId) as { id: string } | undefined;

  const reasonsJson =
    input.reasons != null ? JSON.stringify(input.reasons) : null;

  if (existing) {
    db.prepare(
      `
      UPDATE decisions
      SET decision = ?, strategy = ?, score = ?, reasons_json = ?
      WHERE id = ?
    `
    ).run(input.decision, input.strategy, input.score, reasonsJson, existing.id);
    return;
  }

  db.prepare(
    `
    INSERT INTO decisions (id, user_id, profile_id, decision, strategy, score, reasons_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    `decision-${randomUUID()}`,
    input.userId,
    input.profileId,
    input.decision,
    input.strategy,
    input.score,
    reasonsJson,
    input.createdAt
  );
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
    .all(userId, userId, userId) as Array<
    SandboxUserRow & { match_id: string; matched_at: number }
  >;

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
      passes: [],
      decisions: [],
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

  const decisions = db
    .prepare(
      `
      SELECT d.id, d.profile_id AS profileId, u.name AS profileName,
             d.decision, d.strategy, d.score, d.created_at AS createdAt
      FROM decisions d
      JOIN users u ON u.id = d.profile_id
      WHERE d.user_id = ?
      ORDER BY d.created_at DESC
    `
    )
    .all(userId) as Array<{
    id: string;
    profileId: string;
    profileName: string;
    decision: string;
    strategy: string;
    score: number | null;
    createdAt: number;
  }>;

  const passes = decisions
    .filter((d) => d.decision === "PASS")
    .map((d) => ({
      id: d.id,
      profileId: d.profileId,
      profileName: d.profileName,
      score: d.score,
      strategy: d.strategy,
      createdAt: d.createdAt,
    }));

  return {
    currentUser,
    profiles: status.profiles,
    outgoingLikes,
    incomingLikes,
    passes,
    decisions,
    matches: listSandboxMatches(userId),
    status,
  };
}
