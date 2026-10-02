import type { DemoProfile } from "@/lib/types";
import type {
  DatingPreferences,
  SelectiveEvaluation,
  SelectiveReason,
} from "@/lib/selective/types";

/**
 * Scoring weights (sum = 100). Documented heuristic — not a claim of
 * real-world romantic compatibility.
 *
 * Age fit             20
 * Distance fit        15
 * Relationship goal   25
 * Shared interests    20
 * Lifestyle           20
 * ─────────────────────
 * TOTAL               100
 */
export const SCORE_WEIGHTS = {
  age: 20,
  distance: 15,
  relationshipGoal: 25,
  interests: 20,
  lifestyle: 20,
} as const;

/**
 * Deterministic, local, explainable recommendation engine for AI Selective.
 * Does not call external AI services.
 */
export function evaluateProfile(
  profile: DemoProfile,
  preferences: DatingPreferences
): SelectiveEvaluation {
  const reasons: SelectiveReason[] = [];
  const matchedPreferences: string[] = [];
  const missedPreferences: string[] = [];
  const hardFilterFailures: string[] = [];

  // ── Hard filters (required) ──────────────────────────────────────────
  const ageOk = profile.age >= preferences.minAge && profile.age <= preferences.maxAge;
  if (!ageOk) {
    const msg = "Outside required age range";
    hardFilterFailures.push(msg);
    reasons.push({
      code: "age_required",
      label: msg,
      kind: "hard",
      detail: `${profile.age} not in ${preferences.minAge}–${preferences.maxAge}`,
    });
  }

  const distanceOk = profile.distanceKm <= preferences.maxDistanceKm;
  if (!distanceOk) {
    const msg = "Outside required distance";
    hardFilterFailures.push(msg);
    reasons.push({
      code: "distance_required",
      label: msg,
      kind: "hard",
      detail: `${profile.distanceKm} km > ${preferences.maxDistanceKm} km`,
    });
  }

  if (preferences.smokingPreference === "non_smoker_required" && profile.smoking !== "never") {
    const msg = "Smoking does not meet required preference";
    hardFilterFailures.push(msg);
    reasons.push({
      code: "smoking_required",
      label: msg,
      kind: "hard",
    });
  }

  // ── Soft scores ──────────────────────────────────────────────────────
  const ageScore = scoreAge(profile.age, preferences);
  if (ageOk) {
    matchedPreferences.push("Preferred age");
    reasons.push({
      code: "age_fit",
      label: "Preferred age",
      kind: "matched",
      detail: `${profile.age} within ${preferences.minAge}–${preferences.maxAge}`,
    });
  }

  const distanceScore = scoreDistance(profile.distanceKm, preferences.maxDistanceKm);
  if (distanceOk) {
    matchedPreferences.push(`${profile.distanceKm} km away`);
    reasons.push({
      code: "distance_fit",
      label: `${profile.distanceKm} km away`,
      kind: "matched",
    });
  }

  const goalScore = scoreRelationshipGoal(profile, preferences, matchedPreferences, missedPreferences, reasons);
  const interestScore = scoreInterests(profile, preferences, matchedPreferences, missedPreferences, reasons);
  const lifestyleScore = scoreLifestyle(profile, preferences, matchedPreferences, missedPreferences, reasons);

  const raw =
    ageScore * SCORE_WEIGHTS.age +
    distanceScore * SCORE_WEIGHTS.distance +
    goalScore * SCORE_WEIGHTS.relationshipGoal +
    interestScore * SCORE_WEIGHTS.interests +
    lifestyleScore * SCORE_WEIGHTS.lifestyle;

  // Weighted average of 0–1 category scores → 0–100
  const score = clampScore(Math.round(raw));

  const failedHard = hardFilterFailures.length > 0;
  const decision = failedHard || score < preferences.likeThreshold ? "PASS" : "LIKE";

  if (!failedHard && decision === "LIKE") {
    reasons.push({
      code: "threshold_pass",
      label: `At or above ${preferences.likeThreshold}% threshold`,
      kind: "matched",
    });
  } else if (!failedHard && decision === "PASS") {
    reasons.push({
      code: "threshold_fail",
      label: `Below ${preferences.likeThreshold}% threshold`,
      kind: "missed",
      detail: `${score}% < ${preferences.likeThreshold}%`,
    });
  }

  const highlightChips = buildHighlightChips(
    profile,
    preferences,
    ageOk,
    distanceOk,
    matchedPreferences,
    hardFilterFailures
  );

  return {
    decision,
    score,
    reasons,
    matchedPreferences,
    missedPreferences,
    hardFilterFailures,
    highlightChips,
  };
}

function scoreAge(age: number, preferences: DatingPreferences): number {
  if (age < preferences.minAge || age > preferences.maxAge) return 0;
  const mid = (preferences.minAge + preferences.maxAge) / 2;
  const half = Math.max(1, (preferences.maxAge - preferences.minAge) / 2);
  const dist = Math.abs(age - mid) / half;
  return clamp01(1 - dist * 0.35);
}

function scoreDistance(distanceKm: number, maxKm: number): number {
  if (distanceKm > maxKm) return 0;
  if (maxKm <= 0) return 0;
  return clamp01(1 - distanceKm / maxKm);
}

function scoreRelationshipGoal(
  profile: DemoProfile,
  preferences: DatingPreferences,
  matched: string[],
  missed: string[],
  reasons: SelectiveReason[]
): number {
  const preferred = preferences.preferredRelationshipGoals;
  if (preferred.length === 0) return 0.6;

  if (preferred.includes(profile.relationshipGoal)) {
    matched.push(labelGoal(profile.relationshipGoal));
    reasons.push({
      code: "goal_match",
      label: labelGoal(profile.relationshipGoal),
      kind: "matched",
    });
    return 1;
  }

  // open-to-see is a soft bridge either direction
  if (
    profile.relationshipGoal === "open-to-see" ||
    preferred.includes("open-to-see")
  ) {
    matched.push("Flexible on relationship goals");
    reasons.push({
      code: "goal_partial",
      label: "Flexible on relationship goals",
      kind: "partial",
    });
    return 0.65;
  }

  missed.push("Relationship goal mismatch");
  reasons.push({
    code: "goal_miss",
    label: "Relationship goal mismatch",
    kind: "missed",
    detail: `${labelGoal(profile.relationshipGoal)} vs preferred`,
  });
  return 0.15;
}

function scoreInterests(
  profile: DemoProfile,
  preferences: DatingPreferences,
  matched: string[],
  missed: string[],
  reasons: SelectiveReason[]
): number {
  const preferred = preferences.preferredInterests;
  if (preferred.length === 0) return 0.55;

  const profileSet = new Set(profile.interests.map((i) => i.toLowerCase()));
  const hits = preferred.filter((p) => profileSet.has(p.toLowerCase()));
  const ratio = hits.length / preferred.length;

  for (const hit of hits.slice(0, 3)) {
    matched.push(hit);
    reasons.push({ code: `interest_${hit}`, label: hit, kind: "matched" });
  }

  if (hits.length === 0) {
    missed.push("No shared preferred interests");
    reasons.push({
      code: "interest_miss",
      label: "No shared preferred interests",
      kind: "missed",
    });
  } else if (hits.length < preferred.length) {
    reasons.push({
      code: "interest_partial",
      label: `${hits.length} shared interest${hits.length === 1 ? "" : "s"}`,
      kind: "partial",
    });
  }

  return clamp01(ratio);
}

function scoreLifestyle(
  profile: DemoProfile,
  preferences: DatingPreferences,
  matched: string[],
  missed: string[],
  reasons: SelectiveReason[]
): number {
  let points = 0;
  let parts = 0;

  // Smoking (preferred unless already hard-failed)
  parts += 1;
  if (preferences.smokingPreference === "any") {
    points += 0.7;
  } else if (profile.smoking === "never") {
    points += 1;
    matched.push("Non-smoker");
    reasons.push({ code: "smoke_ok", label: "Non-smoker", kind: "matched" });
  } else if (preferences.smokingPreference === "non_smoker_preferred") {
    points += 0.25;
    missed.push("Smoking preference");
    reasons.push({
      code: "smoke_miss",
      label: "Smoking preference",
      kind: "missed",
    });
  } else {
    points += 0;
  }

  // Activity
  parts += 1;
  const active =
    profile.activityLevel === "active" || profile.activityLevel === "very-active";
  if (preferences.activityPreference === "any") {
    points += 0.7;
  } else if (active) {
    points += 1;
    matched.push("Active lifestyle");
    reasons.push({
      code: "activity_ok",
      label: "Active lifestyle",
      kind: "matched",
    });
  } else {
    points += 0.3;
    missed.push("Activity level");
    reasons.push({
      code: "activity_miss",
      label: "Activity level",
      kind: "missed",
    });
  }

  // Children
  parts += 1;
  if (preferences.childrenPreference === "any") {
    points += 0.75;
  } else if (preferences.childrenPreference === "no_children_preferred") {
    if (!profile.hasChildren) {
      points += 1;
      matched.push("No children");
      reasons.push({ code: "kids_ok", label: "No children", kind: "matched" });
    } else {
      points += 0.2;
      missed.push("Has children");
      reasons.push({ code: "kids_miss", label: "Has children", kind: "missed" });
    }
  } else if (preferences.childrenPreference === "wants_children_aligned") {
    if (profile.wantsChildren === true) {
      points += 1;
      matched.push("Wants children");
      reasons.push({
        code: "kids_want_ok",
        label: "Wants children",
        kind: "matched",
      });
    } else if (profile.wantsChildren === null) {
      points += 0.55;
      reasons.push({
        code: "kids_want_partial",
        label: "Open on children",
        kind: "partial",
      });
    } else {
      points += 0.15;
      missed.push("Children plans differ");
      reasons.push({
        code: "kids_want_miss",
        label: "Children plans differ",
        kind: "missed",
      });
    }
  }

  return clamp01(points / parts);
}

function buildHighlightChips(
  profile: DemoProfile,
  preferences: DatingPreferences,
  ageOk: boolean,
  distanceOk: boolean,
  matched: string[],
  hardFailures: string[]
): Array<{ label: string; ok: boolean }> {
  const chips: Array<{ label: string; ok: boolean }> = [];

  chips.push({ label: "AGE", ok: ageOk });
  chips.push({ label: "DISTANCE", ok: distanceOk });

  const goalHit = preferences.preferredRelationshipGoals.includes(
    profile.relationshipGoal
  ) || profile.relationshipGoal === "open-to-see";
  chips.push({
    label: labelGoal(profile.relationshipGoal).toUpperCase(),
    ok: goalHit && hardFailures.length === 0,
  });

  const interestHit = preferences.preferredInterests.find((p) =>
    profile.interests.some((i) => i.toLowerCase() === p.toLowerCase())
  );
  if (interestHit) {
    chips.push({ label: interestHit.toUpperCase(), ok: true });
  } else if (matched.length > 0) {
    // keep 4 max
  } else {
    chips.push({ label: "INTERESTS", ok: false });
  }

  return chips.slice(0, 4);
}

function labelGoal(goal: DemoProfile["relationshipGoal"]): string {
  switch (goal) {
    case "long-term":
      return "Long-term";
    case "short-term":
      return "Short-term";
    case "casual":
      return "Casual";
    case "friendship":
      return "Friendship";
    case "open-to-see":
      return "Open to see";
    default:
      return goal;
  }
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
