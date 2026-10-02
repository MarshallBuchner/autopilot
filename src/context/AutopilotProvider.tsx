"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DemoAutomationAdapter } from "@/lib/automation/DemoAutomationAdapter";
import type { AutomationAdapter } from "@/lib/automation/AutomationAdapter";
import {
  clearPersistedState,
  downloadText,
  exportSessionCsv,
  exportSessionJson,
  loadPersistedState,
  savePersistedState,
} from "@/lib/storage";
import type {
  ActivityEvent,
  AdapterStatus,
  AnalyticsPoint,
  AppSettings,
  CompletedSession,
  DemoProfile,
  MatchRecord,
  SessionConfig,
  SessionStats,
} from "@/lib/types";
import { DEFAULT_CONFIG, DEFAULT_SETTINGS } from "@/lib/types";

const MAX_ACTIVITY = 50;

function emptyStats(): SessionStats {
  return {
    profilesViewed: 0,
    likesSent: 0,
    matches: 0,
    matchRate: 0,
    durationMs: 0,
    analytics: [{ actionIndex: 0, likes: 0, matches: 0 }],
  };
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function pushActivity(
  prev: ActivityEvent[],
  partial: Omit<ActivityEvent, "id" | "timestamp"> & { timestamp?: number }
): ActivityEvent[] {
  const event: ActivityEvent = {
    id: makeId("evt"),
    timestamp: partial.timestamp ?? Date.now(),
    type: partial.type,
    message: partial.message,
    profileId: partial.profileId,
  };
  return [event, ...prev].slice(0, MAX_ACTIVITY);
}

interface AutopilotContextValue {
  hydrated: boolean;
  status: AdapterStatus;
  isRunning: boolean;
  config: SessionConfig;
  setConfig: (patch: Partial<SessionConfig>) => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  currentProfile: DemoProfile | null;
  showLikeOverlay: boolean;
  showMatchCelebration: boolean;
  stats: SessionStats;
  activity: ActivityEvent[];
  sessions: CompletedSession[];
  matches: MatchRecord[];
  sessionId: string | null;
  sessionStartedAt: number | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  resetDemo: () => void;
  exportResults: (format: "json" | "csv") => void;
  clearAllData: () => void;
  selectedMatchId: string | null;
  setSelectedMatchId: (id: string | null) => void;
}

const AutopilotContext = createContext<AutopilotContextValue | null>(null);

export function AutopilotProvider({ children }: { children: ReactNode }) {
  const adapterRef = useRef<AutomationAdapter | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<AdapterStatus>("disconnected");
  const [config, setConfigState] = useState<SessionConfig>({ ...DEFAULT_CONFIG });
  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS });
  const [currentProfile, setCurrentProfile] = useState<DemoProfile | null>(null);
  const [showLikeOverlay, setShowLikeOverlay] = useState(false);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [stats, setStats] = useState<SessionStats>(emptyStats());
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const statsRef = useRef(stats);
  const sessionIdRef = useRef(sessionId);
  const sessionStartedAtRef = useRef(sessionStartedAt);
  const configRef = useRef(config);
  const matchesRef = useRef(matches);
  const sessionsRef = useRef(sessions);
  const activityRef = useRef(activity);
  const settingsRef = useRef(settings);
  const likeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);
  useEffect(() => {
    sessionStartedAtRef.current = sessionStartedAt;
  }, [sessionStartedAt]);
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  useEffect(() => {
    matchesRef.current = matches;
  }, [matches]);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);
  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const persist = useCallback(() => {
    savePersistedState({
      settings: settingsRef.current,
      sessions: sessionsRef.current,
      matches: matchesRef.current,
      lastActiveSession:
        sessionIdRef.current && sessionStartedAtRef.current
          ? {
              id: sessionIdRef.current,
              startedAt: sessionStartedAtRef.current,
              stats: statsRef.current,
              activity: activityRef.current,
              config: configRef.current,
              running: false,
            }
          : null,
    });
  }, []);

  const finalizeSession = useCallback(
    (reason: "max_profiles" | "stopped" | "error") => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      const sid = sessionIdRef.current;
      const started = sessionStartedAtRef.current;
      if (!sid || !started) return;

      const endedAt = Date.now();
      const current = statsRef.current;
      const durationMs = endedAt - started;
      const completed: CompletedSession = {
        id: sid,
        startedAt: started,
        endedAt,
        durationMs,
        profilesViewed: current.profilesViewed,
        likesSent: current.likesSent,
        matches: current.matches,
        matchRate: current.matchRate,
        config: { ...configRef.current },
        analytics: current.analytics,
      };

      setSessions((prev) => {
        const next = [completed, ...prev.filter((s) => s.id !== completed.id)];
        sessionsRef.current = next;
        return next;
      });

      setStats((prev) => ({ ...prev, durationMs }));
      setActivity((prev) =>
        pushActivity(prev, {
          type: "session_stop",
          message:
            reason === "max_profiles"
              ? "Session complete — max profiles reached"
              : reason === "stopped"
                ? "AUTOPILOT stopped"
                : "Session ended with an error",
        })
      );

      // Defer persist to next tick so refs settle
      setTimeout(() => persist(), 0);
    },
    [persist]
  );

  // Hydrate from localStorage + wire adapter (client-only)
  useEffect(() => {
    const state = loadPersistedState();
    // Defer hydration updates to avoid synchronous setState-in-effect lint
    // and keep SSR/client first paint aligned on defaults.
    startTransition(() => {
      setSettings(state.settings);
      setSessions(state.sessions);
      setMatches(state.matches);
      setConfigState({
        mode: "like_everyone",
        maxProfiles: state.settings.defaultMaxProfiles,
        actionDelaySeconds: state.settings.defaultDelaySeconds,
        randomizeTiming: state.settings.randomizeTiming,
        stopAfterMax: state.settings.stopAfterMax,
      });

      if (state.lastActiveSession && state.lastActiveSession.stats.profilesViewed > 0) {
        setSessionId(state.lastActiveSession.id);
        setSessionStartedAt(state.lastActiveSession.startedAt);
        setStats(state.lastActiveSession.stats);
        setActivity(state.lastActiveSession.activity);
        setConfigState(state.lastActiveSession.config);
      }
    });

    const adapter = new DemoAutomationAdapter();
    adapterRef.current = adapter;

    const unsubs = [
      adapter.on("statusChanged", (s) => setStatus(s)),
      adapter.on("profileLoaded", (profile) => {
        setShowLikeOverlay(false);
        setCurrentProfile(profile);
        setStats((prev) => ({
          ...prev,
          profilesViewed: prev.profilesViewed + 1,
        }));
        setActivity((prev) =>
          pushActivity(prev, {
            type: "profile_loaded",
            message: `Profile loaded — ${profile.firstName}, ${profile.age}`,
            profileId: profile.id,
          })
        );
      }),
      adapter.on("actionPerformed", ({ profile }) => {
        setShowLikeOverlay(true);
        if (likeTimerRef.current) clearTimeout(likeTimerRef.current);
        likeTimerRef.current = setTimeout(() => setShowLikeOverlay(false), 700);

        setStats((prev) => {
          const likesSent = prev.likesSent + 1;
          const matchRate = likesSent > 0 ? prev.matches / likesSent : 0;
          const point: AnalyticsPoint = {
            actionIndex: likesSent,
            likes: likesSent,
            matches: prev.matches,
          };
          return {
            ...prev,
            likesSent,
            matchRate,
            analytics: [...prev.analytics, point],
          };
        });
        setActivity((prev) =>
          pushActivity(prev, {
            type: "liked",
            message: `Liked ${profile.firstName}, ${profile.age}`,
            profileId: profile.id,
          })
        );
      }),
      adapter.on("matchDetected", (profile) => {
        setShowMatchCelebration(true);
        if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
        matchTimerRef.current = setTimeout(() => setShowMatchCelebration(false), 1600);

        const sid = sessionIdRef.current ?? "unknown";
        const record: MatchRecord = {
          id: makeId("match"),
          profile,
          matchedAt: Date.now(),
          sessionId: sid,
        };
        setMatches((prev) => {
          const next = [record, ...prev];
          matchesRef.current = next;
          return next;
        });

        setStats((prev) => {
          const matchesCount = prev.matches + 1;
          const matchRate = prev.likesSent > 0 ? matchesCount / prev.likesSent : 0;
          const analytics = [...prev.analytics];
          if (analytics.length > 0) {
            analytics[analytics.length - 1] = {
              ...analytics[analytics.length - 1]!,
              matches: matchesCount,
            };
          }
          return { ...prev, matches: matchesCount, matchRate, analytics };
        });

        setActivity((prev) =>
          pushActivity(prev, {
            type: "match",
            message: `Match! ${profile.firstName}, ${profile.age} 🎉`,
            profileId: profile.id,
          })
        );
      }),
      adapter.on("sessionComplete", ({ reason }) => {
        finalizeSession(reason);
      }),
      adapter.on("error", ({ message }) => {
        setActivity((prev) =>
          pushActivity(prev, { type: "error", message })
        );
      }),
    ];

    void adapter.connect().then(() => {
      setStatus(adapter.getStatus());
      setHydrated(true);
    });

    return () => {
      unsubs.forEach((u) => u());
      void adapter.disconnect();
      if (likeTimerRef.current) clearTimeout(likeTimerRef.current);
      if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [finalizeSession]);

  // Persist settings / sessions / matches when they change (after hydrate)
  useEffect(() => {
    if (!hydrated) return;
    persist();
  }, [hydrated, settings, sessions, matches, persist]);

  const setConfig = useCallback((patch: Partial<SessionConfig>) => {
    setConfigState((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      settingsRef.current = next;
      return next;
    });
    // Keep live session config aligned with defaults when idle
    setConfigState((prev) => {
      if (adapterRef.current?.getStatus() === "running") return prev;
      const next: SessionConfig = { ...prev };
      if (patch.defaultMaxProfiles !== undefined) {
        next.maxProfiles = patch.defaultMaxProfiles;
      }
      if (patch.defaultDelaySeconds !== undefined) {
        next.actionDelaySeconds = patch.defaultDelaySeconds;
      }
      if (patch.randomizeTiming !== undefined) {
        next.randomizeTiming = patch.randomizeTiming;
      }
      if (patch.stopAfterMax !== undefined) {
        next.stopAfterMax = patch.stopAfterMax;
      }
      return next;
    });
  }, []);

  const start = useCallback(async () => {
    const adapter = adapterRef.current;
    if (!adapter) return;

    const id = makeId("session");
    const started = Date.now();
    setSessionId(id);
    setSessionStartedAt(started);
    sessionIdRef.current = id;
    sessionStartedAtRef.current = started;
    setStats(emptyStats());
    setCurrentProfile(null);
    setShowLikeOverlay(false);
    setShowMatchCelebration(false);
    setActivity([
      {
        id: makeId("evt"),
        timestamp: started,
        type: "session_start",
        message: "AUTOPILOT started — Demo Mode",
      },
    ]);

    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = setInterval(() => {
      const s = sessionStartedAtRef.current;
      if (!s) return;
      setStats((prev) => ({ ...prev, durationMs: Date.now() - s }));
    }, 1000);

    await adapter.start(configRef.current);
  }, []);

  const stop = useCallback(async () => {
    await adapterRef.current?.stop();
  }, []);

  const resetDemo = useCallback(() => {
    void adapterRef.current?.stop();
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    setCurrentProfile(null);
    setShowLikeOverlay(false);
    setShowMatchCelebration(false);
    setStats(emptyStats());
    setActivity([]);
    setSessionId(null);
    setSessionStartedAt(null);
    sessionIdRef.current = null;
    sessionStartedAtRef.current = null;
    setConfigState({
      mode: "like_everyone",
      maxProfiles: settingsRef.current.defaultMaxProfiles,
      actionDelaySeconds: settingsRef.current.defaultDelaySeconds,
      randomizeTiming: settingsRef.current.randomizeTiming,
      stopAfterMax: settingsRef.current.stopAfterMax,
    });
    // Clear last active snapshot but keep history
    savePersistedState({
      settings: settingsRef.current,
      sessions: sessionsRef.current,
      matches: matchesRef.current,
      lastActiveSession: null,
    });
  }, []);

  const exportResults = useCallback((format: "json" | "csv") => {
    const current = statsRef.current;
    const sid = sessionIdRef.current;
    const started = sessionStartedAtRef.current;
    const latestCompleted = sessionsRef.current[0];

    const snapshot: CompletedSession =
      sid && started
        ? {
            id: sid,
            startedAt: started,
            endedAt: Date.now(),
            durationMs: current.durationMs || Date.now() - started,
            profilesViewed: current.profilesViewed,
            likesSent: current.likesSent,
            matches: current.matches,
            matchRate: current.matchRate,
            config: { ...configRef.current },
            analytics: current.analytics,
          }
        : latestCompleted ?? {
            id: "empty",
            startedAt: Date.now(),
            endedAt: Date.now(),
            durationMs: 0,
            profilesViewed: 0,
            likesSent: 0,
            matches: 0,
            matchRate: 0,
            config: { ...configRef.current },
            analytics: [],
          };

    if (format === "json") {
      downloadText(
        `autopilot-session-${snapshot.id}.json`,
        exportSessionJson(snapshot),
        "application/json"
      );
    } else {
      downloadText(
        `autopilot-session-${snapshot.id}.csv`,
        exportSessionCsv(snapshot),
        "text/csv"
      );
    }
  }, []);

  const clearAllData = useCallback(() => {
    void adapterRef.current?.stop();
    clearPersistedState();
    setSettings({ ...DEFAULT_SETTINGS });
    setSessions([]);
    setMatches([]);
    setStats(emptyStats());
    setActivity([]);
    setCurrentProfile(null);
    setSessionId(null);
    setSessionStartedAt(null);
    setSelectedMatchId(null);
    setConfigState({ ...DEFAULT_CONFIG });
    sessionsRef.current = [];
    matchesRef.current = [];
    settingsRef.current = { ...DEFAULT_SETTINGS };
  }, []);

  const value = useMemo<AutopilotContextValue>(
    () => ({
      hydrated,
      status,
      isRunning: status === "running",
      config,
      setConfig,
      settings,
      updateSettings,
      currentProfile,
      showLikeOverlay,
      showMatchCelebration,
      stats,
      activity,
      sessions,
      matches,
      sessionId,
      sessionStartedAt,
      start,
      stop,
      resetDemo,
      exportResults,
      clearAllData,
      selectedMatchId,
      setSelectedMatchId,
    }),
    [
      hydrated,
      status,
      config,
      setConfig,
      settings,
      updateSettings,
      currentProfile,
      showLikeOverlay,
      showMatchCelebration,
      stats,
      activity,
      sessions,
      matches,
      sessionId,
      sessionStartedAt,
      start,
      stop,
      resetDemo,
      exportResults,
      clearAllData,
      selectedMatchId,
    ]
  );

  return (
    <AutopilotContext.Provider value={value}>{children}</AutopilotContext.Provider>
  );
}

export function useAutopilot(): AutopilotContextValue {
  const ctx = useContext(AutopilotContext);
  if (!ctx) {
    throw new Error("useAutopilot must be used within AutopilotProvider");
  }
  return ctx;
}
