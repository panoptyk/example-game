import { BehaviorState } from "./behaviorState";

/**
 * FailureBehavior is an endcap for Behavior FSMs denoting it has completed.
 * It's singleton FailureBehavior.instance can be used to save memory if no modifications required
 */
export class FailureBehavior extends BehaviorState {
    // Singleton Pattern
    private static _instance: FailureBehavior;
    public static get instance(): FailureBehavior {
        if (!FailureBehavior._instance) {
            FailureBehavior._instance = new FailureBehavior();
        }
        return FailureBehavior._instance;
    }

    public async act() {
      return;
    }

    public nextState(): BehaviorState {
        return this;
    }
}