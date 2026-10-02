import type { AvatarStyle, DemoProfile } from "@/lib/types";
import type {
  ActivityLevel,
  DrinkingHabit,
  RelationshipGoal,
  SelectiveDecision,
  SmokingHabit,
  StrategyKind,
} from "@/lib/selective/types";

export const SANDBOX_CURRENT_USER_ID = "user-alex";

export interface SandboxUserRow {
  id: string;
  name: string;
  age: number;
  distance_km: number;
  occupation: string;
  bio: string;
  interests_json: string;
  avatar_hue: number;
  avatar_variant: number;
  avatar_style: string;
  relationship_goal: string;
  activity_level: string;
  smoking: string;
  drinking: string;
  has_children: number;
  wants_children: number | null;
  is_current_user: number;
  created_at: number;
}

export interface SandboxLikeRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: number;
}

export interface SandboxMatchRow {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: number;
}

export interface SandboxDecisionRow {
  id: string;
  user_id: string;
  profile_id: string;
  decision: string;
  strategy: string;
  score: number | null;
  reasons_json: string | null;
  created_at: number;
}

export interface SandboxStatus {
  available: boolean;
  initialized: boolean;
  connected: boolean;
  reason?: string;
  currentUserId: string;
  profiles: number;
  outgoingLikes: number;
  incomingLikes: number;
  passes: number;
  decisions: number;
  matches: number;
  database: "connected" | "unavailable" | "uninitialized";
  environment: "local" | "vercel" | "unknown";
}

export interface SandboxLikeResult {
  like: {
    id: string;
    fromUserId: string;
    toUserId: string;
    createdAt: number;
    created: boolean;
  };
  match: {
    id: string;
    userAId: string;
    userBId: string;
    createdAt: number;
    created: boolean;
    profile: DemoProfile;
  } | null;
}

export interface SandboxDecisionResult {
  decision: {
    id: string;
    userId: string;
    profileId: string;
    decision: SelectiveDecision;
    strategy: StrategyKind;
    score: number | null;
    reasons: unknown;
    createdAt: number;
    created: boolean;
  };
  like: SandboxLikeResult["like"] | null;
  match: SandboxLikeResult["match"];
}

export interface SandboxInspectData {
  currentUser: DemoProfile & { id: string };
  profiles: number;
  outgoingLikes: Array<{ id: string; toUserId: string; toName: string; createdAt: number }>;
  incomingLikes: Array<{ id: string; fromUserId: string; fromName: string; createdAt: number }>;
  passes: Array<{
    id: string;
    profileId: string;
    profileName: string;
    score: number | null;
    strategy: string;
    createdAt: number;
  }>;
  decisions: Array<{
    id: string;
    profileId: string;
    profileName: string;
    decision: string;
    strategy: string;
    score: number | null;
    createdAt: number;
  }>;
  matches: Array<{
    id: string;
    profile: DemoProfile;
    matchedAt: number;
    sessionId: string;
  }>;
  status: SandboxStatus;
}

function wantsChildrenFromRow(value: number | null): boolean | null {
  if (value === null || value === undefined) return null;
  return value === 1;
}

export function rowToProfile(row: SandboxUserRow): DemoProfile {
  return {
    id: row.id,
    firstName: row.name,
    age: row.age,
    distanceKm: row.distance_km,
    occupation: row.occupation,
    bio: row.bio,
    interests: JSON.parse(row.interests_json) as string[],
    avatarHue: row.avatar_hue,
    avatarVariant: row.avatar_variant,
    avatarStyle: row.avatar_style as AvatarStyle,
    relationshipGoal: (row.relationship_goal || "open-to-see") as RelationshipGoal,
    activityLevel: (row.activity_level || "moderate") as ActivityLevel,
    smoking: (row.smoking || "never") as SmokingHabit,
    drinking: (row.drinking || "socially") as DrinkingHabit,
    hasChildren: Boolean(row.has_children),
    wantsChildren: wantsChildrenFromRow(row.wants_children),
  };
}
