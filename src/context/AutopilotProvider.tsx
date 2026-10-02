"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DemoAutomationAdapter } from "@/lib/automation/DemoAutomationAdapter";
import { SandboxAutomationAdapter } from "@/lib/automation/SandboxAutomationAdapter";
import type { AutomationAdapter } from "@/lib/automation/AutomationAdapter";
import {
  fetchSandboxInspect,
  fetchSandboxMatches,
  fetchSandboxStatus,
  initializeSandboxRemote,
  resetSandboxRemote,
} from "@/lib/sandbox/client";
import type { SandboxInspectData, SandboxStatus } from "@/lib/sandbox/types";
import {
  clearPersistedState,
  downloadText,
  exportSessionCsv,
  exportSessionJson,
  loadPersistedState,
  savePersistedState,
} from "@/lib/storage";
import { normalizeDatingPreferences } from "@/lib/selective/types";
import type { DatingPreferences, SelectiveEvaluation } from "@/lib/selective/types";
import type {
  ActivityEvent,
  AdapterStatus,
  AnalyticsPoint,
  AppSettings,
  CompletedSession,
  DemoProfile,
  EnvironmentMode,
  MatchRecord,
  SandboxConnectionState,
  SessionCompleteSummary,
  SessionConfig,
  SessionStats,
} from "@/lib/types";
import { DEFAULT_CONFIG, DEFAULT_SETTINGS } from "@/lib/types";

const MAX_ACTIVITY = 50;

function emptyStats(): SessionStats {
  return {
    profilesViewed: 0,
    likesSent: 0,
    passes: 0,
    matches: 0,
    matchRate: 0,
    likeRate: 0,
    averageFitScore: 0,
    fitScoreSum: 0,
    fitScoreCount: 0,
    durationMs: 0,
    analytics: [{ actionIndex: 0, likes: 0, passes: 0, matches: 0, avgFitScore: 0 }],
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

function createAdapter(environment: EnvironmentMode): AutomationAdapter {
  return environment === "live_sandbox"
    ? new SandboxAutomationAdapter()
    : new DemoAutomationAdapter();
}

interface AutopilotContextValue {
  hydrated: boolean;
  status: AdapterStatus;
  isRunning: boolean;
  environment: EnvironmentMode;
  setEnvironment: (env: EnvironmentMode) => Promise<void>;
  sandboxStatus: SandboxStatus | null;
  sandboxConnection: SandboxConnectionState;
  sandboxInspect: SandboxInspectData | null;
  refreshSandbox: () => Promise<void>;
  initializeSandbox: () => Promise<void>;
  resetSandbox: () => Promise<void>;
  config: SessionConfig;
  setConfig: (patch: Partial<SessionConfig>) => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  currentProfile: DemoProfile | null;
  currentEvaluation: SelectiveEvaluation | null;
  datingPreferences: DatingPreferences;
  updateDatingPreferences: (patch: Partial<DatingPreferences>) => void;
  resetDatingPreferences: () => void;
  showLikeOverlay: boolean;
  showPassOverlay: boolean;
  showCardExit: boolean;
  cardExitDirection: "left" | "right";
  showMatchCelebration: boolean;
  matchProfile: DemoProfile | null;
  matchFitScore: number | null;
  sessionComplete: SessionCompleteSummary | null;
  stats: SessionStats;
  activity: ActivityEvent[];
  sessions: CompletedSession[];
  matches: MatchRecord[];
  sessionId: string | null;
  sessionStartedAt: number | null;
  canStart: boolean;
  startBlockedReason: string | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  resetDemo: () => void;
  exportResults: (format: "json" | "csv") => void;
  clearAllData: () => void;
  dismissMatch: () => void;
  dismissSessionComplete: () => void;
  selectedMatchId: string | null;
  setSelectedMatchId: (id: string | null) => void;
}

const AutopilotContext = createContext<AutopilotContextValue | null>(null);

export function AutopilotProvider({ children }: { children: ReactNode }) {
  const adapterRef = useRef<AutomationAdapter | null>(null);
  const environmentRef = useRef<EnvironmentMode>("demo");
  const [bootstrapped, setBootstrapped] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<AdapterStatus>("disconnected");
  const [environment, setEnvironmentState] = useState<EnvironmentMode>("demo");
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus | null>(null);
  const [sandboxConnection, setSandboxConnection] =
    useState<SandboxConnectionState>("disconnected");
  const [sandboxInspect, setSandboxInspect] = useState<SandboxInspectData | null>(
    null
  );
  const [config, setConfigState] = useState<SessionConfig>({ ...DEFAULT_CONFIG });
  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS });
  const [currentProfile, setCurrentProfile] = useState<DemoProfile | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<SelectiveEvaluation | null>(null);
  const [datingPreferences, setDatingPreferences] = useState<DatingPreferences>(
    normalizeDatingPreferences(DEFAULT_SETTINGS.datingPreferences)
  );
  const [showLikeOverlay, setShowLikeOverlay] = useState(false);
  const [showPassOverlay, setShowPassOverlay] = useState(false);
  const [showCardExit, setShowCardExit] = useState(false);
  const [cardExitDirection, setCardExitDirection] = useState<"left" | "right">("right");
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [matchProfile, setMatchProfile] = useState<DemoProfile | null>(null);
  const [matchFitScore, setMatchFitScore] = useState<number | null>(null);
  const [sessionComplete, setSessionComplete] =
    useState<SessionCompleteSummary | null>(null);
  const [stats, setStats] = useState<SessionStats>(emptyStats());
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [demoMatches, setDemoMatches] = useState<MatchRecord[]>([]);
  const [sandboxMatches, setSandboxMatches] = useState<MatchRecord[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statsRef = useRef(stats);
  const sessionIdRef = useRef(sessionId);
  const sessionStartedAtRef = useRef(sessionStartedAt);
  const configRef = useRef(config);
  const demoMatchesRef = useRef(demoMatches);
  const sessionsRef = useRef(sessions);
  const activityRef = useRef(activity);
  const settingsRef = useRef(settings);
  const datingPreferencesRef = useRef(datingPreferences);
  const currentEvaluationRef = useRef(currentEvaluation);
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
    demoMatchesRef.current = demoMatches;
  }, [demoMatches]);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);
  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    datingPreferencesRef.current = datingPreferences;
  }, [datingPreferences]);
  useEffect(() => {
    currentEvaluationRef.current = currentEvaluation;
  }, [currentEvaluation]);
  useEffect(() => {
    environmentRef.current = environment;
  }, [environment]);

  const matches = environment === "demo" ? demoMatches : sandboxMatches;

  const persist = useCallback(() => {
    savePersistedState({
      settings: settingsRef.current,
      sessions: sessionsRef.current,
      matches: demoMatchesRef.current,
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

  const refreshSandbox = useCallback(async () => {
    setSandboxConnection("connecting");
    try {
      const statusPayload = await fetchSandboxStatus();
      setSandboxStatus(statusPayload);
      if (!statusPayload.available) {
        setSandboxConnection("error");
        setSandboxMatches([]);
        setSandboxInspect(null);
        return;
      }
      if (!statusPayload.initialized) {
        setSandboxConnection("disconnected");
        setSandboxMatches([]);
        setSandboxInspect(null);
        return;
      }
      const [matchList, inspect] = await Promise.all([
        fetchSandboxMatches(),
        fetchSandboxInspect(),
      ]);
      setSandboxMatches(matchList);
      setSandboxInspect(inspect);
      setSandboxConnection("connected");
    } catch {
      setSandboxConnection("error");
      setSandboxStatus((prev) =>
        prev
          ? { ...prev, connected: false, available: false, database: "unavailable" }
          : null
      );
    }
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
        passes: current.passes,
        matches: current.matches,
        matchRate: current.matchRate,
        likeRate: current.likeRate,
        averageFitScore: current.averageFitScore,
        strategy:
          configRef.current.mode === "ai_selective" ? "AI_SELECTIVE" : "LIKE_EVERYONE",
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

      if (reason === "max_profiles") {
        setSessionComplete({ reason, session: { ...completed, durationMs } });
      }

      setTimeout(() => persist(), 0);
      if (environmentRef.current === "live_sandbox") {
        void refreshSandbox();
      }
    },
    [persist, refreshSandbox]
  );

  const finalizeSessionRef = useRef(finalizeSession);
  useEffect(() => {
    finalizeSessionRef.current = finalizeSession;
  }, [finalizeSession]);

  const bindAdapter = useCallback(
    (adapter: AutomationAdapter, cancelled: () => boolean) => {
      const unsubs = [
        adapter.on("statusChanged", (s) => {
          if (!cancelled()) setStatus(s);
        }),
        adapter.on("profileLoaded", (profile) => {
          if (cancelled()) return;
          setShowLikeOverlay(false);
          setShowPassOverlay(false);
          setShowCardExit(false);
          setCardExitDirection("right");
          setCurrentEvaluation(null);
          if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
          setCurrentProfile(profile);
          setStats((prev) => ({
            ...prev,
            profilesViewed: prev.profilesViewed + 1,
          }));
          const selective = configRef.current.mode === "ai_selective";
          setActivity((prev) =>
            pushActivity(prev, {
              type: selective ? "evaluating" : "profile_loaded",
              message: selective
                ? `Evaluating ${profile.firstName}, ${profile.age}`
                : `Profile loaded — ${profile.firstName}, ${profile.age}`,
              profileId: profile.id,
            })
          );
        }),
        adapter.on("profileEvaluated", ({ profile, evaluation }) => {
          if (cancelled()) return;
          setCurrentEvaluation(evaluation);
          currentEvaluationRef.current = evaluation;
          setActivity((prev) =>
            pushActivity(prev, {
              type: "info",
              message: `${evaluation.score}% fit — ${evaluation.decision}`,
              profileId: profile.id,
            })
          );
        }),
        adapter.on("actionPerformed", ({ profile, action, evaluation }) => {
          if (cancelled()) return;
          const isPass = action === "pass";
          setShowLikeOverlay(!isPass);
          setShowPassOverlay(isPass);
          setShowCardExit(false);
          setCardExitDirection(isPass ? "left" : "right");
          if (evaluation) {
            setCurrentEvaluation(evaluation);
            currentEvaluationRef.current = evaluation;
          }
          if (likeTimerRef.current) clearTimeout(likeTimerRef.current);
          if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
          likeTimerRef.current = setTimeout(() => {
            setShowLikeOverlay(false);
            setShowPassOverlay(false);
            setShowCardExit(true);
          }, 480);

          setStats((prev) => {
            const likesSent = prev.likesSent + (isPass ? 0 : 1);
            const passes = prev.passes + (isPass ? 1 : 0);
            const decided = likesSent + passes;
            const matchRate = likesSent > 0 ? prev.matches / likesSent : 0;
            const likeRate = decided > 0 ? likesSent / decided : 0;
            let fitScoreSum = prev.fitScoreSum;
            let fitScoreCount = prev.fitScoreCount;
            if (evaluation) {
              fitScoreSum += evaluation.score;
              fitScoreCount += 1;
            }
            const averageFitScore =
              fitScoreCount > 0 ? Math.round(fitScoreSum / fitScoreCount) : 0;
            const point: AnalyticsPoint = {
              actionIndex: decided,
              likes: likesSent,
              passes,
              matches: prev.matches,
              avgFitScore: averageFitScore,
            };
            return {
              ...prev,
              likesSent,
              passes,
              matchRate,
              likeRate,
              fitScoreSum,
              fitScoreCount,
              averageFitScore,
              analytics: [...prev.analytics, point],
            };
          });
          setActivity((prev) =>
            pushActivity(prev, {
              type: isPass ? "passed" : "liked",
              message: isPass
                ? evaluation
                  ? `${evaluation.score}% fit — PASS`
                  : `Passed ${profile.firstName}, ${profile.age}`
                : evaluation
                  ? `${evaluation.score}% fit — LIKE`
                  : `Liked ${profile.firstName}, ${profile.age}`,
              profileId: profile.id,
            })
          );
        }),
        adapter.on("matchDetected", (profile) => {
          if (cancelled()) return;
          setMatchProfile(profile);
          setMatchFitScore(currentEvaluationRef.current?.score ?? null);
          setShowMatchCelebration(true);
          if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
          matchTimerRef.current = setTimeout(() => {
            setShowMatchCelebration(false);
            setMatchProfile(null);
          }, 2200);

          const sid = sessionIdRef.current ?? "unknown";
          const isSandbox = environmentRef.current === "live_sandbox";

          if (isSandbox) {
            void fetchSandboxMatches()
              .then((list) => setSandboxMatches(list))
              .catch(() => {
                // Keep celebration even if refresh fails; append optimistic record
                setSandboxMatches((prev) => {
                  if (prev.some((m) => m.profile.id === profile.id)) return prev;
                  return [
                    {
                      id: makeId("match"),
                      profile,
                      matchedAt: Date.now(),
                      sessionId: sid,
                    },
                    ...prev,
                  ];
                });
              });
          } else {
            const record: MatchRecord = {
              id: makeId("match"),
              profile,
              matchedAt: Date.now(),
              sessionId: sid,
              fitScore: currentEvaluationRef.current?.score ?? null,
            };
            setDemoMatches((prev) => {
              const next = [record, ...prev];
              demoMatchesRef.current = next;
              return next;
            });
          }

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
              message: isSandbox
                ? `Match confirmed — ${profile.firstName}, ${profile.age}`
                : `Match! ${profile.firstName}, ${profile.age} 🎉`,
              profileId: profile.id,
            })
          );
        }),
        adapter.on("sessionComplete", ({ reason }) => {
          if (!cancelled()) finalizeSessionRef.current(reason);
        }),
        adapter.on("error", ({ message }) => {
          if (cancelled()) return;
          setActivity((prev) => pushActivity(prev, { type: "error", message }));
        }),
      ];
      return () => unsubs.forEach((u) => u());
    },
    []
  );

  // Hydrate from localStorage (once), then unlock adapter wiring.
  // Avoid cancelling bootstrap on React Strict Mode remount — that left the
  // adapter unwired and the sidebar stuck on "Connecting…".
  useEffect(() => {
    const state = loadPersistedState();
    const prefs = normalizeDatingPreferences(state.settings.datingPreferences);
    const env = state.settings.environment ?? "demo";

    setSettings(state.settings);
    setSessions(state.sessions);
    setDemoMatches(state.matches);
    demoMatchesRef.current = state.matches;
    settingsRef.current = state.settings;
    setDatingPreferences(prefs);
    datingPreferencesRef.current = prefs;
    setEnvironmentState(env);
    environmentRef.current = env;
    setConfigState({
      mode: "like_everyone",
      maxProfiles: state.settings.defaultMaxProfiles,
      actionDelaySeconds: state.settings.defaultDelaySeconds,
      randomizeTiming: state.settings.randomizeTiming,
      stopAfterMax: state.settings.stopAfterMax,
      preferences: prefs,
    });

    if (state.lastActiveSession && state.lastActiveSession.stats.profilesViewed > 0) {
      setSessionId(state.lastActiveSession.id);
      setSessionStartedAt(state.lastActiveSession.startedAt);
      setStats({ ...emptyStats(), ...state.lastActiveSession.stats });
      setActivity(state.lastActiveSession.activity);
      setConfigState({
        ...state.lastActiveSession.config,
        preferences: normalizeDatingPreferences(
          state.lastActiveSession.config?.preferences ?? prefs
        ),
      });
    }

    setBootstrapped(true);
  }, []);

  // Wire adapter whenever environment changes (after bootstrap)
  useEffect(() => {
    if (!bootstrapped) return;

    let cancelled = false;
    const env = environment;
    const adapter = createAdapter(env);
    adapterRef.current = adapter;
    const unbind = bindAdapter(adapter, () => cancelled);

    void (async () => {
      if (env === "live_sandbox") {
        setSandboxConnection("connecting");
        await refreshSandbox();
      } else {
        setSandboxConnection("disconnected");
      }
      await adapter.connect();
      if (cancelled) return;
      setStatus(adapter.getStatus());
      setHydrated(true);
    })();

    const unlock = window.setTimeout(() => {
      if (cancelled) return;
      setHydrated(true);
      if (adapterRef.current) {
        setStatus(adapterRef.current.getStatus());
      }
    }, 50);

    return () => {
      cancelled = true;
      window.clearTimeout(unlock);
      unbind();
      void adapter.disconnect();
      if (adapterRef.current === adapter) {
        adapterRef.current = null;
      }
    };
  }, [bootstrapped, environment, bindAdapter, refreshSandbox]);

  // Persist settings / sessions / demo matches when they change (after hydrate)
  useEffect(() => {
    if (!hydrated) return;
    persist();
  }, [hydrated, settings, sessions, demoMatches, persist]);

  const setConfig = useCallback((patch: Partial<SessionConfig>) => {
    setConfigState((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (patch.datingPreferences) {
        next.datingPreferences = normalizeDatingPreferences(patch.datingPreferences);
      }
      settingsRef.current = next;
      return next;
    });
    if (patch.datingPreferences) {
      const prefs = normalizeDatingPreferences(patch.datingPreferences);
      setDatingPreferences(prefs);
      datingPreferencesRef.current = prefs;
    }
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
      if (patch.datingPreferences) {
        next.preferences = normalizeDatingPreferences(patch.datingPreferences);
      }
      return next;
    });
  }, []);

  const updateDatingPreferences = useCallback((patch: Partial<DatingPreferences>) => {
    setDatingPreferences((prev) => {
      const next = normalizeDatingPreferences({ ...prev, ...patch });
      datingPreferencesRef.current = next;
      setSettings((s) => {
        const merged = { ...s, datingPreferences: next };
        settingsRef.current = merged;
        return merged;
      });
      setConfigState((cfg) => {
        if (adapterRef.current?.getStatus() === "running") return cfg;
        return { ...cfg, preferences: next };
      });
      return next;
    });
  }, []);

  const resetDatingPreferences = useCallback(() => {
    updateDatingPreferences(normalizeDatingPreferences(null));
  }, [updateDatingPreferences]);

  const setEnvironment = useCallback(
    async (env: EnvironmentMode) => {
      if (env === environmentRef.current) return;
      if (adapterRef.current?.getStatus() === "running") {
        await adapterRef.current.stop();
      }
      setCurrentProfile(null);
      setShowLikeOverlay(false);
      setShowCardExit(false);
      setShowMatchCelebration(false);
      setMatchProfile(null);
      setSessionComplete(null);
      setSelectedMatchId(null);
      setActivity((prev) =>
        pushActivity(prev, {
          type: "info",
          message:
            env === "live_sandbox"
              ? "Switched to LIVE SANDBOX"
              : "Switched to DEMO mode",
        })
      );
      updateSettings({ environment: env });
      setEnvironmentState(env);
      environmentRef.current = env;
    },
    [updateSettings]
  );

  const initializeSandbox = useCallback(async () => {
    setSandboxConnection("connecting");
    try {
      const statusPayload = await initializeSandboxRemote();
      setSandboxStatus(statusPayload);
      updateSettings({ sandboxSetupComplete: true, environment: "live_sandbox" });
      await refreshSandbox();
      // Reconnect adapter after init
      if (adapterRef.current) {
        await adapterRef.current.connect();
        setStatus(adapterRef.current.getStatus());
      }
      setActivity((prev) =>
        pushActivity(prev, {
          type: "info",
          message: `Sandbox initialized — ${statusPayload.profiles} profiles, ${statusPayload.incomingLikes} incoming likes`,
        })
      );
    } catch (error) {
      setSandboxConnection("error");
      setActivity((prev) =>
        pushActivity(prev, {
          type: "error",
          message:
            error instanceof Error ? error.message : "Failed to initialize sandbox",
        })
      );
      throw error;
    }
  }, [refreshSandbox, updateSettings]);

  const resetSandbox = useCallback(async () => {
    setSandboxConnection("connecting");
    try {
      const statusPayload = await resetSandboxRemote();
      setSandboxStatus(statusPayload);
      setSandboxMatches([]);
      await refreshSandbox();
      if (adapterRef.current) {
        await adapterRef.current.connect();
        setStatus(adapterRef.current.getStatus());
      }
      setActivity((prev) =>
        pushActivity(prev, {
          type: "info",
          message: "Live Sandbox reset — seed data restored",
        })
      );
    } catch (error) {
      setSandboxConnection("error");
      setActivity((prev) =>
        pushActivity(prev, {
          type: "error",
          message: error instanceof Error ? error.message : "Failed to reset sandbox",
        })
      );
      throw error;
    }
  }, [refreshSandbox]);

  const startBlockedReason = useMemo(() => {
    if (environment === "demo") return null;
    if (sandboxConnection === "connecting") return "Connecting to Live Sandbox…";
    if (!sandboxStatus?.available) {
      return (
        sandboxStatus?.reason ??
        "LOCAL SETUP REQUIRED — Live Sandbox needs a local SQLite backend."
      );
    }
    if (!sandboxStatus.initialized) {
      return "Initialize Live Sandbox before starting AUTOPILOT.";
    }
    if (sandboxConnection === "error" || status === "error") {
      return "Live Sandbox is offline or errored. Check setup and try again.";
    }
    if (sandboxConnection !== "connected" && status !== "connected" && status !== "stopped") {
      return "Waiting for Live Sandbox connection…";
    }
    return null;
  }, [environment, sandboxConnection, sandboxStatus, status]);

  const canStart =
    !isRunningStatus(status) &&
    (environment === "demo" || startBlockedReason === null);

  const start = useCallback(async () => {
    let adapter = adapterRef.current;
    if (!adapter) {
      adapter = createAdapter(environmentRef.current);
      adapterRef.current = adapter;
      await adapter.connect();
      setStatus(adapter.getStatus());
      setHydrated(true);
    }

    if (environmentRef.current === "live_sandbox") {
      await refreshSandbox();
      const latest = await fetchSandboxStatus();
      setSandboxStatus(latest);
      if (!latest.available || !latest.initialized) {
        setActivity((prev) =>
          pushActivity(prev, {
            type: "error",
            message: latest.reason ?? "Live Sandbox is not ready",
          })
        );
        return;
      }
    }

    const id = makeId("session");
    const started = Date.now();
    setSessionId(id);
    setSessionStartedAt(started);
    sessionIdRef.current = id;
    sessionStartedAtRef.current = started;
    setStats(emptyStats());
    setCurrentProfile(null);
    setCurrentEvaluation(null);
    setShowLikeOverlay(false);
    setShowPassOverlay(false);
    setShowCardExit(false);
    setCardExitDirection("right");
    setShowMatchCelebration(false);
    setMatchProfile(null);
    setMatchFitScore(null);
    setSessionComplete(null);
    const modeLabel =
      configRef.current.mode === "ai_selective" ? "AI SELECTIVE" : "LIKE EVERYONE";
    const envLabel =
      environmentRef.current === "live_sandbox" ? "LIVE SANDBOX" : "DEMO";
    setActivity([
      {
        id: makeId("evt"),
        timestamp: started,
        type: "session_start",
        message: `AUTOPILOT started (${envLabel} · ${modeLabel})`,
      },
    ]);

    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = setInterval(() => {
      const s = sessionStartedAtRef.current;
      if (!s) return;
      setStats((prev) => ({ ...prev, durationMs: Date.now() - s }));
    }, 1000);

    const startConfig: SessionConfig = {
      ...configRef.current,
      preferences: normalizeDatingPreferences(datingPreferencesRef.current),
    };
    configRef.current = startConfig;
    setConfigState(startConfig);
    await adapter.start(startConfig);
  }, [refreshSandbox]);

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
    setCurrentEvaluation(null);
    setShowLikeOverlay(false);
    setShowPassOverlay(false);
    setShowCardExit(false);
    setCardExitDirection("right");
    setShowMatchCelebration(false);
    setMatchProfile(null);
    setMatchFitScore(null);
    setSessionComplete(null);
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
      preferences: normalizeDatingPreferences(datingPreferencesRef.current),
    });
    savePersistedState({
      settings: settingsRef.current,
      sessions: sessionsRef.current,
      matches: demoMatchesRef.current,
      lastActiveSession: null,
    });
  }, []);

  const dismissMatch = useCallback(() => {
    if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
    setShowMatchCelebration(false);
    setMatchProfile(null);
    setMatchFitScore(null);
  }, []);

  const dismissSessionComplete = useCallback(() => {
    setSessionComplete(null);
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
            passes: current.passes,
            matches: current.matches,
            matchRate: current.matchRate,
            likeRate: current.likeRate,
            averageFitScore: current.averageFitScore,
            strategy:
              configRef.current.mode === "ai_selective" ? "AI_SELECTIVE" : "LIKE_EVERYONE",
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
            passes: 0,
            matches: 0,
            matchRate: 0,
            likeRate: 0,
            averageFitScore: 0,
            strategy: "LIKE_EVERYONE",
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
    setDemoMatches([]);
    setSandboxMatches([]);
    setStats(emptyStats());
    setActivity([]);
    setCurrentProfile(null);
    setCurrentEvaluation(null);
    setShowLikeOverlay(false);
    setShowPassOverlay(false);
    setShowCardExit(false);
    setCardExitDirection("right");
    setShowMatchCelebration(false);
    setMatchProfile(null);
    setMatchFitScore(null);
    setSessionComplete(null);
    setSessionId(null);
    setSessionStartedAt(null);
    setSelectedMatchId(null);
    const prefs = normalizeDatingPreferences(null);
    setDatingPreferences(prefs);
    datingPreferencesRef.current = prefs;
    setConfigState({ ...DEFAULT_CONFIG, preferences: prefs });
    setEnvironmentState("demo");
    environmentRef.current = "demo";
    sessionsRef.current = [];
    demoMatchesRef.current = [];
    settingsRef.current = {
      ...DEFAULT_SETTINGS,
      datingPreferences: prefs,
    };
  }, []);

  const value = useMemo<AutopilotContextValue>(
    () => ({
      hydrated,
      status,
      isRunning: status === "running",
      environment,
      setEnvironment,
      sandboxStatus,
      sandboxConnection,
      sandboxInspect,
      refreshSandbox,
      initializeSandbox,
      resetSandbox,
      config,
      setConfig,
      settings,
      updateSettings,
      currentProfile,
      currentEvaluation,
      datingPreferences,
      updateDatingPreferences,
      resetDatingPreferences,
      showLikeOverlay,
      showPassOverlay,
      showCardExit,
      cardExitDirection,
      showMatchCelebration,
      matchProfile,
      matchFitScore,
      sessionComplete,
      stats,
      activity,
      sessions,
      matches,
      sessionId,
      sessionStartedAt,
      canStart,
      startBlockedReason,
      start,
      stop,
      resetDemo,
      exportResults,
      clearAllData,
      dismissMatch,
      dismissSessionComplete,
      selectedMatchId,
      setSelectedMatchId,
    }),
    [
      hydrated,
      status,
      environment,
      setEnvironment,
      sandboxStatus,
      sandboxConnection,
      sandboxInspect,
      refreshSandbox,
      initializeSandbox,
      resetSandbox,
      config,
      setConfig,
      settings,
      updateSettings,
      currentProfile,
      currentEvaluation,
      datingPreferences,
      updateDatingPreferences,
      resetDatingPreferences,
      showLikeOverlay,
      showPassOverlay,
      showCardExit,
      cardExitDirection,
      showMatchCelebration,
      matchProfile,
      matchFitScore,
      sessionComplete,
      stats,
      activity,
      sessions,
      matches,
      sessionId,
      sessionStartedAt,
      canStart,
      startBlockedReason,
      start,
      stop,
      resetDemo,
      exportResults,
      clearAllData,
      dismissMatch,
      dismissSessionComplete,
      selectedMatchId,
    ]
  );

  return (
    <AutopilotContext.Provider value={value}>{children}</AutopilotContext.Provider>
  );
}

function isRunningStatus(status: AdapterStatus): boolean {
  return status === "running";
}

export function useAutopilot(): AutopilotContextValue {
  const ctx = useContext(AutopilotContext);
  if (!ctx) {
    throw new Error("useAutopilot must be used within AutopilotProvider");
  }
  return ctx;
}
