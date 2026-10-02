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
  return {
    ...profile,
    avatarHue: hue,
    avatarVariant: profile.avatarVariant ?? Math.abs(hue) % 12,
    avatarStyle: profile.avatarStyle ?? AVATAR_STYLES[Math.abs(hue) % AVATAR_STYLES.length]!,
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
    return {
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
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
    settings: { ...DEFAULT_SETTINGS },
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
    "id,startedAt,endedAt,durationMs,profilesViewed,likesSent,matches,matchRate";
  const row = [
    session.id,
    new Date(session.startedAt).toISOString(),
    new Date(session.endedAt).toISOString(),
    session.durationMs,
    session.profilesViewed,
    session.likesSent,
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
