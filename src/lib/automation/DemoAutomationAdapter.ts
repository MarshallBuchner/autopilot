import type {
  AutomationAdapter,
  AutomationEvent,
  AutomationEventMap,
  AutomationListener,
} from "@/lib/automation/AutomationAdapter";
import { generateDemoProfile } from "@/lib/automation/demoProfiles";
import type { AdapterStatus, DemoProfile, SessionConfig } from "@/lib/types";

type ListenerMap = {
  [E in AutomationEvent]?: Set<AutomationListener<E>>;
};

/**
 * Simulation-only adapter (V0.1 / V0.2).
 * Emits realistic profile/like/match events on a timer.
 * Does not contact any third-party dating service.
 */
export class DemoAutomationAdapter implements AutomationAdapter {
  private status: AdapterStatus = "disconnected";
  private listeners: ListenerMap = {};
  private timer: ReturnType<typeof setTimeout> | null = null;
  private config: SessionConfig | null = null;
  private profilesProcessed = 0;
  private seed = Date.now() % 1_000_000;
  private currentProfile: DemoProfile | null = null;
  private phase: "idle" | "showing" | "liking" = "idle";

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
    if (config.mode !== "like_everyone") {
      this.emit("error", {
        message: "AI Selective mode is coming later. Use Like Everyone for V0.2.",
      });
      return;
    }

    this.config = { ...config };
    this.profilesProcessed = 0;
    this.seed = (Date.now() + Math.floor(Math.random() * 10_000)) % 1_000_000;
    this.status = "running";
    this.emit("statusChanged", this.status);
    this.scheduleNext(0);
  }

  async stop(): Promise<void> {
    this.clearTimer();
    const wasRunning = this.status === "running";
    this.phase = "idle";
    this.currentProfile = null;
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
    // Vary ±35% around selected delay
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

    if (this.phase === "idle" || this.phase === "liking") {
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
      this.phase = "showing";
      this.emit("profileLoaded", this.currentProfile);
      this.scheduleNext(this.delayMs());
      return;
    }

    if (this.phase === "showing" && this.currentProfile) {
      const profile = this.currentProfile;
      this.phase = "liking";
      this.profilesProcessed += 1;
      this.emit("actionPerformed", { profile, action: "like" });

      // ~5–12% match probability
      const matchChance = 0.05 + Math.random() * 0.07;
      const matched = Math.random() < matchChance;
      if (matched) {
        this.emit("matchDetected", profile);
      }

      // Leave room for LIKE exit animation; longer pause after a match celebration
      const exitMs = 700;
      const matchPauseMs = matched ? 2000 : 0;
      const baseGap = Math.min(1100, Math.max(500, this.delayMs() * 0.35));
      this.scheduleNext(baseGap + exitMs + matchPauseMs);
    }
  }
}
