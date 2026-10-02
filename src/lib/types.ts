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
}

export interface SessionConfig {
  mode: AutomationMode;
  maxProfiles: number;
  actionDelaySeconds: number;
  randomizeTiming: boolean;
  stopAfterMax: boolean;
}

export interface ActivityEvent {
  id: string;
  timestamp: number;
  type: "profile_loaded" | "liked" | "match" | "session_start" | "session_stop" | "error" | "info";
  message: string;
  profileId?: string;
}

export interface MatchRecord {
  id: string;
  profile: DemoProfile;
  matchedAt: number;
  sessionId: string;
}

export interface AnalyticsPoint {
  actionIndex: number;
  likes: number;
  matches: number;
}

export interface SessionStats {
  profilesViewed: number;
  likesSent: number;
  matches: number;
  matchRate: number;
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
  matches: number;
  matchRate: number;
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
};

export const DEFAULT_CONFIG: SessionConfig = {
  mode: "like_everyone",
  maxProfiles: 50,
  actionDelaySeconds: 3,
  randomizeTiming: true,
  stopAfterMax: true,
};

export const AVATAR_STYLES: AvatarStyle[] = [
  "soft",
  "studio",
  "warm",
  "cool",
  "dusk",
  "mint",
];
