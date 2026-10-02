import { lifestyleForName } from "@/lib/automation/demoProfiles";
import { normalizeDatingPreferences } from "@/lib/selective/types";
import type {
  AppSettings,
  CompletedSession,
  DemoProfile,
  MatchRecord,
  PersistedState,
  PartialSessionSnapshot,
} from "@/lib/types";
import { AVATAR_STYLES, DEFAULT_SETTINGS } from "@/lib/types";

const STORAGE_KEY = "autopilot.v01.state";

function normalizeProfile(profile: DemoProfile): DemoProfile {
  const hue = profile.avatarHue ?? 320;
  const lifestyle =
    profile.relationshipGoal && profile.activityLevel && profile.smoking
      ? {
          relationshipGoal: profile.relationshipGoal,
          activityLevel: profile.activityLevel,
          smoking: profile.smoking,
          drinking: profile.drinking ?? "socially",
          hasChildren: Boolean(profile.hasChildren),
          wantsChildren:
            profile.wantsChildren === undefined ? null : profile.wantsChildren,
        }
      : lifestyleForName(profile.firstName ?? "Unknown");

  return {
    ...profile,
    avatarHue: hue,
    avatarVariant: profile.avatarVariant ?? Math.abs(hue) % 12,
    avatarStyle: profile.avatarStyle ?? AVATAR_STYLES[Math.abs(hue) % AVATAR_STYLES.length]!,
    ...lifestyle,
  };
}

function normalizeSession(session: CompletedSession): CompletedSession {
  const likesSent = session.likesSent ?? 0;
  const passes = session.passes ?? 0;
  const profilesViewed = session.profilesViewed ?? likesSent + passes;
  const matchRate = likesSent > 0 ? (session.matches ?? 0) / likesSent : 0;
  const likeRate = profilesViewed > 0 ? likesSent / profilesViewed : 0;
  return {
    ...session,
    profilesViewed,
    likesSent,
    passes,
    matches: session.matches ?? 0,
    matchRate: session.matchRate ?? matchRate,
    likeRate: session.likeRate ?? likeRate,
    averageFitScore: session.averageFitScore ?? 0,
    strategy:
      session.strategy ??
      (session.config?.mode === "ai_selective" ? "AI_SELECTIVE" : "LIKE_EVERYONE"),
    config: {
      ...session.config,
      preferences: normalizeDatingPreferences(session.config?.preferences),
    },
    analytics: Array.isArray(session.analytics)
      ? session.analytics.map((p) => ({
          actionIndex: p.actionIndex,
          likes: p.likes,
          passes: p.passes ?? 0,
          matches: p.matches,
          avgFitScore: p.avgFitScore ?? 0,
        }))
      : [],
  };
}

export function loadPersistedState(): PersistedState {
  if (typeof window === "undefined") {
    return emptyState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const matches = Array.isArray(parsed.matches)
      ? parsed.matches.map((m) => ({ ...m, profile: normalizeProfile(m.profile) }))
      : [];
    const settings = {
      ...DEFAULT_SETTINGS,
      ...parsed.settings,
      datingPreferences: normalizeDatingPreferences(
        parsed.settings?.datingPreferences ?? DEFAULT_SETTINGS.datingPreferences
      ),
    };
    if (settings.environment !== "demo" && settings.environment !== "live_sandbox") {
      settings.environment = "demo";
    }
    if (typeof settings.sandboxSetupComplete !== "boolean") {
      settings.sandboxSetupComplete = false;
    }
    return {
      settings,
      sessions: Array.isArray(parsed.sessions)
        ? parsed.sessions.map(normalizeSession)
        : [],
      matches,
      lastActiveSession: parsed.lastActiveSession ?? null,
    };
  } catch {
    return emptyState();
  }
}

export function savePersistedState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota / private mode — fail silently
  }
}

export function clearPersistedState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

function emptyState(): PersistedState {
  return {
    settings: {
      ...DEFAULT_SETTINGS,
      datingPreferences: normalizeDatingPreferences(DEFAULT_SETTINGS.datingPreferences),
    },
    sessions: [],
    matches: [],
    lastActiveSession: null,
  };
}

export function exportSessionJson(session: CompletedSession): string {
  return JSON.stringify(session, null, 2);
}

export function exportSessionCsv(session: CompletedSession): string {
  const header =
    "id,strategy,startedAt,endedAt,durationMs,profilesViewed,likesSent,passes,likeRate,averageFitScore,matches,matchRate";
  const row = [
    session.id,
    session.strategy,
    new Date(session.startedAt).toISOString(),
    new Date(session.endedAt).toISOString(),
    session.durationMs,
    session.profilesViewed,
    session.likesSent,
    session.passes,
    session.likeRate.toFixed(4),
    session.averageFitScore.toFixed(1),
    session.matches,
    session.matchRate.toFixed(4),
  ].join(",");
  return `${header}\n${row}\n`;
}

export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type { AppSettings, CompletedSession, MatchRecord, PartialSessionSnapshot };
