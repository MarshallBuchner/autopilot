import type { SelectiveEvaluation } from "@/lib/selective/types";
import type { AdapterStatus, DemoProfile, SessionConfig } from "@/lib/types";

export type AutomationEventMap = {
  profileLoaded: DemoProfile;
  profileEvaluated: {
    profile: DemoProfile;
    evaluation: SelectiveEvaluation;
  };
  actionPerformed: {
    profile: DemoProfile;
    action: "like" | "pass";
    evaluation?: SelectiveEvaluation;
  };
  matchDetected: DemoProfile;
  statusChanged: AdapterStatus;
  sessionComplete: { reason: "max_profiles" | "stopped" | "error" };
  error: { message: string };
};

export type AutomationEvent = keyof AutomationEventMap;

export type AutomationListener<E extends AutomationEvent> = (
  payload: AutomationEventMap[E]
) => void;

/**
 * Abstraction for dating-app automation backends.
 * The dashboard consumes this interface — never a concrete simulator.
 * A future local browser-extension helper could implement the same contract.
 */
export interface AutomationAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  start(config: SessionConfig): Promise<void>;
  stop(): Promise<void>;
  getStatus(): AdapterStatus;
  on<E extends AutomationEvent>(event: E, listener: AutomationListener<E>): () => void;
  off<E extends AutomationEvent>(event: E, listener: AutomationListener<E>): void;
}
