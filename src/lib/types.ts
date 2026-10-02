import type {
  ActivityLevel,
  DatingPreferences,
  DrinkingHabit,
  RelationshipGoal,
  SelectiveEvaluation,
  SmokingHabit,
  StrategyKind,
} from "@/lib/selective/types";
import { DEFAULT_DATING_PREFERENCES } from "@/lib/selective/types";

export type AutomationMode = "like_everyone" | "ai_selective";

/** Which automation environment drives the dashboard. */
export type EnvironmentMode = "demo" | "live_sandbox";

export type AdapterStatus = "disconnected" | "connected" | "running" | "stopped" | "error";

/** Connection health for Live Sandbox backend (separate from adapter run status). */
export type SandboxConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type AvatarStyle = "soft" | "studio" | "warm" | "cool" | "dusk" | "mint";

export type { ActivityLevel, DatingPreferences, RelationshipGoal, SelectiveEvaluation, StrategyKind };

export interface DemoProfile {
  id: string;
  firstName: string;
  age: number;
  distanceKm: number;
  occupation: string;
  bio: string;
  interests: string[];
  /** Deterministic hue for portrait palette */
  avatarHue: number;
  /** Portrait illustration variant 0–11 */
  avatarVariant: number;
  /** Visual style family for background/lighting */
  avatarStyle: AvatarStyle;
  relationshipGoal: RelationshipGoal;
  activityLevel: ActivityLevel;
  smoking: SmokingHabit;
  drinking: DrinkingHabit;
  hasChildren: boolean;
  /** null = open / unsure */
  wantsChildren: boolean | null;
}

export interface SessionConfig {
  mode: AutomationMode;
  maxProfiles: number;
  actionDelaySeconds: number;
  randomizeTiming: boolean;
  stopAfterMax: boolean;
  /** Snapshot of dating preferences used for AI Selective (and recorded on the session). */
  preferences: DatingPreferences;
}

export interface ActivityEvent {
  id: string;
  timestamp: number;
  type:
    | "profile_loaded"
    | "evaluating"
    | "liked"
    | "passed"
    | "match"
    | "session_start"
    | "session_stop"
    | "error"
    | "info";
  message: string;
  profileId?: string;
}

export interface MatchRecord {
  id: string;
  profile: DemoProfile;
  matchedAt: number;
  sessionId: string;
  fitScore?: number | null;
}

export interface AnalyticsPoint {
  actionIndex: number;
  likes: number;
  passes: number;
  matches: number;
  avgFitScore: number;
}

export interface SessionStats {
  profilesViewed: number;
  likesSent: number;
  passes: number;
  matches: number;
  matchRate: number;
  likeRate: number;
  averageFitScore: number;
  fitScoreSum: number;
  fitScoreCount: number;
  durationMs: number;
  analytics: AnalyticsPoint[];
}

export interface CompletedSession {
  id: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  profilesViewed: number;
  likesSent: number;
  passes: number;
  matches: number;
  matchRate: number;
  likeRate: number;
  averageFitScore: number;
  strategy: StrategyKind;
  config: SessionConfig;
  analytics: AnalyticsPoint[];
}

export interface AppSettings {
  defaultMaxProfiles: number;
  defaultDelaySeconds: number;
  randomizeTiming: boolean;
  stopAfterMax: boolean;
  /** Preferred automation environment (Demo vs Live Sandbox). */
  environment: EnvironmentMode;
  /** True once the user has completed first-time Live Sandbox setup. */
  sandboxSetupComplete: boolean;
  /** Dating preferences for AI Selective. */
  datingPreferences: DatingPreferences;
}

export interface PersistedState {
  settings: AppSettings;
  sessions: CompletedSession[];
  matches: MatchRecord[];
  lastActiveSession: PartialSessionSnapshot | null;
}

export interface PartialSessionSnapshot {
  id: string;
  startedAt: number;
  stats: SessionStats;
  activity: ActivityEvent[];
  config: SessionConfig;
  running: boolean;
}

export type SessionCompleteReason = "max_profiles" | "stopped" | "error";

export interface SessionCompleteSummary {
  reason: SessionCompleteReason;
  session: CompletedSession;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultMaxProfiles: 50,
  defaultDelaySeconds: 3,
  randomizeTiming: true,
  stopAfterMax: true,
  environment: "demo",
  sandboxSetupComplete: false,
  datingPreferences: { ...DEFAULT_DATING_PREFERENCES },
};

export const DEFAULT_CONFIG: SessionConfig = {
  mode: "like_everyone",
  maxProfiles: 50,
  actionDelaySeconds: 3,
  randomizeTiming: true,
  stopAfterMax: true,
  preferences: { ...DEFAULT_DATING_PREFERENCES },
};

export const AVATAR_STYLES: AvatarStyle[] = [
  "soft",
  "studio",
  "warm",
  "cool",
  "dusk",
  "mint",
];
