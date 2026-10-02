import type {
  AutomationAdapter,
  AutomationEvent,
  AutomationEventMap,
  AutomationListener,
} from "@/lib/automation/AutomationAdapter";
import { generateDemoProfile } from "@/lib/automation/demoProfiles";
import { evaluateProfile } from "@/lib/selective/SelectiveDecisionEngine";
import type { SelectiveEvaluation } from "@/lib/selective/types";
import type { AdapterStatus, DemoProfile, SessionConfig } from "@/lib/types";

type ListenerMap = {
  [E in AutomationEvent]?: Set<AutomationListener<E>>;
};

/**
 * Simulation-only adapter.
 * Like Everyone + AI Selective both run locally; matches are simulated on LIKE only.
 */
export class DemoAutomationAdapter implements AutomationAdapter {
  private status: AdapterStatus = "disconnected";
  private listeners: ListenerMap = {};
  private timer: ReturnType<typeof setTimeout> | null = null;
  private config: SessionConfig | null = null;
  private profilesProcessed = 0;
  private seed = Date.now() % 1_000_000;
  private currentProfile: DemoProfile | null = null;
  private currentEvaluation: SelectiveEvaluation | null = null;
  private phase: "idle" | "showing" | "evaluating" | "acting" = "idle";

  async connect(): Promise<void> {
    this.status = "connected";
    this.emit("statusChanged", this.status);
  }

  async disconnect(): Promise<void> {
    await this.stop();
    this.status = "disconnected";
    this.emit("statusChanged", this.status);
  }

  async start(config: SessionConfig): Promise<void> {
    if (this.status === "running") return;
    if (this.status === "disconnected") {
      await this.connect();
    }
    if (config.mode !== "like_everyone" && config.mode !== "ai_selective") {
      this.emit("error", { message: "Unknown automation mode." });
      return;
    }

    this.config = { ...config, preferences: { ...config.preferences } };
    this.profilesProcessed = 0;
    this.seed = (Date.now() + Math.floor(Math.random() * 10_000)) % 1_000_000;
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
    } else if (this.status !== "disconnected") {
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
        // Isolate listener failures from the simulator loop
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
    if (this.status !== "running" || !this.config) return;

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

      this.seed += 1;
      this.currentProfile = generateDemoProfile(this.seed);
      this.currentEvaluation = null;
      this.phase = "showing";
      this.emit("profileLoaded", this.currentProfile);

      if (this.config.mode === "ai_selective") {
        // Brief beat so the profile registers before evaluation UI
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
      // Hold score/reasons briefly before acting
      this.scheduleNext(Math.min(1400, Math.max(700, this.delayMs() * 0.45)));
      return;
    }

    if (
      (this.phase === "showing" || this.phase === "evaluating") &&
      this.currentProfile
    ) {
      const profile = this.currentProfile;
      this.phase = "acting";
      this.profilesProcessed += 1;

      if (this.config.mode === "ai_selective") {
        const evaluation =
          this.currentEvaluation ??
          evaluateProfile(profile, this.config.preferences);
        const action = evaluation.decision === "LIKE" ? "like" : "pass";
        this.emit("actionPerformed", { profile, action, evaluation });

        let matched = false;
        if (action === "like") {
          const matchChance = 0.05 + Math.random() * 0.07;
          matched = Math.random() < matchChance;
          if (matched) this.emit("matchDetected", profile);
        }

        const exitMs = 700;
        const matchPauseMs = matched ? 2000 : 0;
        const baseGap = Math.min(1100, Math.max(500, this.delayMs() * 0.35));
        this.scheduleNext(baseGap + exitMs + matchPauseMs);
        return;
      }

      // Like Everyone
      this.emit("actionPerformed", { profile, action: "like" });
      const matchChance = 0.05 + Math.random() * 0.07;
      const matched = Math.random() < matchChance;
      if (matched) this.emit("matchDetected", profile);

      const exitMs = 700;
      const matchPauseMs = matched ? 2000 : 0;
      const baseGap = Math.min(1100, Math.max(500, this.delayMs() * 0.35));
      this.scheduleNext(baseGap + exitMs + matchPauseMs);
    }
  }
}
