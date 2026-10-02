import type { DemoProfile } from "@/lib/types";

export type RelationshipGoal =
  | "long-term"
  | "short-term"
  | "casual"
  | "friendship"
  | "open-to-see";

export type ActivityLevel = "low" | "moderate" | "active" | "very-active";

export type SmokingHabit = "never" | "sometimes" | "regularly";

export type DrinkingHabit = "never" | "sometimes" | "socially" | "regularly";

export type SmokingPreference = "any" | "non_smoker_preferred" | "non_smoker_required";

export type ActivityPreference = "any" | "active_preferred";

export type ChildrenPreference = "any" | "no_children_preferred" | "wants_children_aligned";

export type SelectiveDecision = "LIKE" | "PASS";

export type StrategyKind = "LIKE_EVERYONE" | "AI_SELECTIVE";

/**
 * User-configurable dating preferences for AI Selective.
 * Age + distance are hard (required) filters.
 * Goals, interests, and most lifestyle settings are preferred (scored).
 */
export interface DatingPreferences {
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;
  preferredRelationshipGoals: RelationshipGoal[];
  preferredInterests: string[];
  smokingPreference: SmokingPreference;
  activityPreference: ActivityPreference;
  childrenPreference: ChildrenPreference;
  /** Profiles at or above this score (0–100) receive a LIKE, unless hard-filtered. */
  likeThreshold: number;
}

export interface SelectiveReason {
  code: string;
  label: string;
  kind: "hard" | "matched" | "missed" | "partial";
  detail?: string;
}

export interface SelectiveEvaluation {
  decision: SelectiveDecision;
  score: number;
  reasons: SelectiveReason[];
  matchedPreferences: string[];
  missedPreferences: string[];
  hardFilterFailures: string[];
  /** Compact chips for UI (2–4 strongest). */
  highlightChips: Array<{ label: string; ok: boolean }>;
}

export interface ProfileLifestyle {
  relationshipGoal: RelationshipGoal;
  activityLevel: ActivityLevel;
  smoking: SmokingHabit;
  drinking: DrinkingHabit;
  hasChildren: boolean;
  wantsChildren: boolean | null;
}

export type SelectiveProfile = DemoProfile;

export const RELATIONSHIP_GOAL_OPTIONS: Array<{
  value: RelationshipGoal;
  label: string;
}> = [
  { value: "long-term", label: "Long-term" },
  { value: "short-term", label: "Short-term" },
  { value: "casual", label: "Casual" },
  { value: "friendship", label: "Friendship" },
  { value: "open-to-see", label: "Open to see" },
];

export const INTEREST_OPTIONS = [
  "Hockey",
  "Fitness",
  "Outdoors",
  "Travel",
  "Music",
  "Dogs",
  "Cooking",
  "Hiking",
  "Coffee",
  "Photography",
  "Art",
  "Yoga",
  "Movies",
  "Reading",
  "Running",
  "Camping",
  "Design",
  "Gaming",
] as const;

/** Fictional/demo defaults for Alex — not real personal preferences. */
export const DEFAULT_DATING_PREFERENCES: DatingPreferences = {
  minAge: 24,
  maxAge: 32,
  maxDistanceKm: 40,
  preferredRelationshipGoals: ["long-term", "open-to-see"],
  preferredInterests: ["Hiking", "Coffee", "Music", "Travel"],
  smokingPreference: "non_smoker_preferred",
  activityPreference: "active_preferred",
  childrenPreference: "any",
  likeThreshold: 70,
};

export function normalizeDatingPreferences(
  partial?: Partial<DatingPreferences> | null
): DatingPreferences {
  const base = { ...DEFAULT_DATING_PREFERENCES, ...partial };
  const minAge = clampInt(base.minAge, 18, 70);
  const maxAge = clampInt(base.maxAge, minAge, 80);
  return {
    minAge,
    maxAge,
    maxDistanceKm: clampInt(base.maxDistanceKm, 1, 200),
    preferredRelationshipGoals: Array.isArray(base.preferredRelationshipGoals)
      ? base.preferredRelationshipGoals
      : [...DEFAULT_DATING_PREFERENCES.preferredRelationshipGoals],
    preferredInterests: Array.isArray(base.preferredInterests)
      ? base.preferredInterests
      : [...DEFAULT_DATING_PREFERENCES.preferredInterests],
    smokingPreference: base.smokingPreference ?? "any",
    activityPreference: base.activityPreference ?? "any",
    childrenPreference: base.childrenPreference ?? "any",
    likeThreshold: clampInt(base.likeThreshold, 50, 90),
  };
}

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}
