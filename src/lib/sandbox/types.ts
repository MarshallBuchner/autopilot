import type { AvatarStyle, DemoProfile } from "@/lib/types";

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

export interface SandboxStatus {
  available: boolean;
  initialized: boolean;
  connected: boolean;
  reason?: string;
  currentUserId: string;
  profiles: number;
  outgoingLikes: number;
  incomingLikes: number;
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

export interface SandboxInspectData {
  currentUser: DemoProfile & { id: string };
  profiles: number;
  outgoingLikes: Array<{ id: string; toUserId: string; toName: string; createdAt: number }>;
  incomingLikes: Array<{ id: string; fromUserId: string; fromName: string; createdAt: number }>;
  matches: Array<{
    id: string;
    profile: DemoProfile;
    matchedAt: number;
  }>;
  status: SandboxStatus;
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
  };
}
