export type AutomationMode = "like_everyone" | "ai_selective";

export type AdapterStatus = "disconnected" | "connected" | "running" | "stopped" | "error";

export interface DemoProfile {
  id: string;
  firstName: string;
  age: number;
  distanceKm: number;
  occupation: string;
  bio: string;
  interests: string[];
  /** Deterministic hue for abstract avatar gradient */
  avatarHue: number;
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

export const DEFAULT_SETTINGS: AppSettings = {
  defaultMaxProfiles: 50,
  defaultDelaySeconds: 3,
  randomizeTiming: true,
  stopAfterMax: true,
};

export const DEFAULT_CONFIG: SessionConfig = {
  mode: "like_everyone",
  maxProfiles: 50,
  actionDelaySeconds: 3,
  randomizeTiming: true,
  stopAfterMax: true,
};
