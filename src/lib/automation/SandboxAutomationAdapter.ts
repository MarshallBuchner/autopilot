import type {
  AutomationAdapter,
  AutomationEvent,
  AutomationEventMap,
  AutomationListener,
} from "@/lib/automation/AutomationAdapter";
import {
  fetchNextSandboxProfile,
  fetchSandboxStatus,
  postSandboxDecision,
  postSandboxLike,
} from "@/lib/sandbox/client";
import { evaluateProfile } from "@/lib/selective/SelectiveDecisionEngine";
import type { SelectiveEvaluation } from "@/lib/selective/types";
import type { AdapterStatus, DemoProfile, SessionConfig } from "@/lib/types";

type ListenerMap = {
  [E in AutomationEvent]?: Set<AutomationListener<E>>;
};

/**
 * Live Sandbox adapter.
 * Talks to the AUTOPILOT-owned sandbox API — never fabricates likes/matches.
 * AI Selective evaluates locally, then persists LIKE/PASS via the backend.
 */
export class SandboxAutomationAdapter implements AutomationAdapter {
  private status: AdapterStatus = "disconnected";
  private listeners: ListenerMap = {};
  private timer: ReturnType<typeof setTimeout> | null = null;
  private config: SessionConfig | null = null;
  private profilesProcessed = 0;
  private currentProfile: DemoProfile | null = null;
  private currentEvaluation: SelectiveEvaluation | null = null;
  private phase: "idle" | "showing" | "evaluating" | "acting" = "idle";
  private ticking = false;

  async connect(): Promise<void> {
    this.status = "disconnected";
    this.emit("statusChanged", this.status);
    try {
      const status = await fetchSandboxStatus();
      if (!status.available) {
        this.status = "error";
        this.emit("statusChanged", this.status);
        this.emit("error", {
          message: status.reason ?? "LOCAL SETUP REQUIRED — Live Sandbox unavailable",
        });
        return;
      }
      if (!status.initialized) {
        this.status = "error";
        this.emit("statusChanged", this.status);
        this.emit("error", {
          message: "Sandbox not initialized. Open setup and click INITIALIZE SANDBOX.",
        });
        return;
      }
      this.status = "connected";
      this.emit("statusChanged", this.status);
    } catch (error) {
      this.status = "error";
      this.emit("statusChanged", this.status);
      this.emit("error", {
        message:
          error instanceof Error
            ? error.message
            : "Failed to reach Live Sandbox backend",
      });
    }
  }

  async disconnect(): Promise<void> {
    await this.stop();
    this.status = "disconnected";
    this.emit("statusChanged", this.status);
  }

  async start(config: SessionConfig): Promise<void> {
    if (this.status === "running") return;

    if (this.status === "disconnected" || this.status === "error") {
      await this.connect();
    }
    if (this.status !== "connected" && this.status !== "stopped") {
      this.emit("error", {
        message: "Live Sandbox is not connected. Initialize the sandbox first.",
      });
      return;
    }

    if (config.mode !== "like_everyone" && config.mode !== "ai_selective") {
      this.emit("error", { message: "Unknown automation mode." });
      return;
    }

    try {
      const status = await fetchSandboxStatus();
      if (!status.available || !status.initialized || !status.connected) {
        this.status = "error";
        this.emit("statusChanged", this.status);
        this.emit("error", {
          message: status.reason ?? "Live Sandbox backend unavailable",
        });
        return;
      }
    } catch (error) {
      this.status = "error";
      this.emit("statusChanged", this.status);
      this.emit("error", {
        message:
          error instanceof Error ? error.message : "Live Sandbox backend unavailable",
      });
      return;
    }

    this.config = { ...config, preferences: { ...config.preferences } };
    this.profilesProcessed = 0;
    this.phase = "idle";
    this.currentProfile = null;
    this.currentEvaluation = null;
    this.status = "running";
    this.emit("statusChanged", this.status);
    this.scheduleNext(0);
  }

  async stop(): Promise<void> {
    this.clearTimer();
    const wasRunning = this.status === "running";
    this.phase = "idle";
    this.currentProfile = null;
    this.currentEvaluation = null;
    if (wasRunning) {
      this.status = "stopped";
      this.emit("statusChanged", this.status);
      this.emit("sessionComplete", { reason: "stopped" });
    } else if (this.status !== "disconnected" && this.status !== "error") {
      this.status = "stopped";
      this.emit("statusChanged", this.status);
    }
  }

  getStatus(): AdapterStatus {
    return this.status;
  }

  on<E extends AutomationEvent>(event: E, listener: AutomationListener<E>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set() as ListenerMap[E];
    }
    (this.listeners[event] as Set<AutomationListener<E>>).add(listener);
    return () => this.off(event, listener);
  }

  off<E extends AutomationEvent>(event: E, listener: AutomationListener<E>): void {
    (this.listeners[event] as Set<AutomationListener<E>> | undefined)?.delete(listener);
  }

  private emit<E extends AutomationEvent>(event: E, payload: AutomationEventMap[E]): void {
    const set = this.listeners[event] as Set<AutomationListener<E>> | undefined;
    set?.forEach((listener) => {
      try {
        listener(payload);
      } catch {
        // Isolate listener failures from the automation loop
      }
    });
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private delayMs(): number {
    const base = (this.config?.actionDelaySeconds ?? 3) * 1000;
    if (!this.config?.randomizeTiming) return base;
    const factor = 0.65 + Math.random() * 0.7;
    return Math.max(400, Math.round(base * factor));
  }

  private scheduleNext(ms: number): void {
    this.clearTimer();
    this.timer = setTimeout(() => {
      void this.tick();
    }, ms);
  }

  private async tick(): Promise<void> {
    if (this.status !== "running" || !this.config || this.ticking) return;
    this.ticking = true;
    try {
      if (this.phase === "idle" || this.phase === "acting") {
        if (
          this.config.stopAfterMax &&
          this.profilesProcessed >= this.config.maxProfiles
        ) {
          this.clearTimer();
          this.phase = "idle";
          this.status = "stopped";
          this.emit("statusChanged", this.status);
          this.emit("sessionComplete", { reason: "max_profiles" });
          return;
        }

        let profile: DemoProfile | null = null;
        try {
          profile = await fetchNextSandboxProfile();
        } catch (error) {
          this.emit("error", {
            message:
              error instanceof Error
                ? `Failed to fetch next profile: ${error.message}`
                : "Failed to fetch next profile",
          });
          this.clearTimer();
          this.phase = "idle";
          this.status = "error";
          this.emit("statusChanged", this.status);
          this.emit("sessionComplete", { reason: "error" });
          return;
        }

        if (!profile) {
          this.clearTimer();
          this.phase = "idle";
          this.status = "stopped";
          this.emit("statusChanged", this.status);
          this.emit("sessionComplete", { reason: "max_profiles" });
          return;
        }

        this.currentProfile = profile;
        this.currentEvaluation = null;
        this.phase = "showing";
        this.emit("profileLoaded", profile);

        if (this.config.mode === "ai_selective") {
          this.scheduleNext(Math.min(900, Math.max(350, this.delayMs() * 0.35)));
        } else {
          this.scheduleNext(this.delayMs());
        }
        return;
      }

      if (
        this.phase === "showing" &&
        this.currentProfile &&
        this.config.mode === "ai_selective"
      ) {
        const profile = this.currentProfile;
        const evaluation = evaluateProfile(profile, this.config.preferences);
        this.currentEvaluation = evaluation;
        this.phase = "evaluating";
        this.emit("profileEvaluated", { profile, evaluation });
        this.scheduleNext(Math.min(1400, Math.max(700, this.delayMs() * 0.45)));
        return;
      }

      if (
        (this.phase === "showing" || this.phase === "evaluating") &&
        this.currentProfile
      ) {
        const profile = this.currentProfile;
        this.phase = "acting";

        if (this.config.mode === "ai_selective") {
          const evaluation =
            this.currentEvaluation ??
            evaluateProfile(profile, this.config.preferences);
          const decision = evaluation.decision;

          try {
            const result = await postSandboxDecision({
              toUserId: profile.id,
              decision,
              strategy: "AI_SELECTIVE",
              score: evaluation.score,
              reasons: {
                hardFilterFailures: evaluation.hardFilterFailures,
                matchedPreferences: evaluation.matchedPreferences,
                missedPreferences: evaluation.missedPreferences,
                highlightChips: evaluation.highlightChips,
              },
            });

            this.profilesProcessed += 1;
            this.emit("actionPerformed", {
              profile,
              action: decision === "LIKE" ? "like" : "pass",
              evaluation,
            });

            const matched = Boolean(result.match);
            if (result.match) {
              this.emit("matchDetected", result.match.profile);
            }

            const exitMs = 700;
            const matchPauseMs = matched ? 2000 : 0;
            const baseGap = Math.min(1100, Math.max(500, this.delayMs() * 0.35));
            this.scheduleNext(baseGap + exitMs + matchPauseMs);
          } catch (error) {
            this.emit("error", {
              message:
                error instanceof Error
                  ? `Decision failed for ${profile.firstName}: ${error.message}`
                  : `Decision failed for ${profile.firstName}`,
            });
            const baseGap = Math.min(1100, Math.max(500, this.delayMs() * 0.35));
            this.scheduleNext(baseGap + 700);
          }
          return;
        }

        // Like Everyone
        try {
          const likeResult = await postSandboxLike(profile.id);
          if (likeResult.like.created || likeResult.like.id) {
            this.profilesProcessed += 1;
            this.emit("actionPerformed", { profile, action: "like" });
          }
          const matched = Boolean(likeResult.match);
          if (likeResult.match) {
            this.emit("matchDetected", likeResult.match.profile);
          }
          const exitMs = 700;
          const matchPauseMs = matched ? 2000 : 0;
          const baseGap = Math.min(1100, Math.max(500, this.delayMs() * 0.35));
          this.scheduleNext(baseGap + exitMs + matchPauseMs);
        } catch (error) {
          this.emit("error", {
            message:
              error instanceof Error
                ? `Like failed for ${profile.firstName}: ${error.message}`
                : `Like failed for ${profile.firstName}`,
          });
          const baseGap = Math.min(1100, Math.max(500, this.delayMs() * 0.35));
          this.scheduleNext(baseGap + 700);
        }
      }
    } finally {
      this.ticking = false;
    }
  }
}
