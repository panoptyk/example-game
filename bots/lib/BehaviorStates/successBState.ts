import { BehaviorState } from "./behaviorState";

/**
 * SuccessBehavior is an endcap for FSMs denoting it has completed.
 * It's singleton SuccessBehavior.instance can be used to save memory if no modifications required
 */
export class SuccessBehavior extends BehaviorState {
    // Singleton Pattern
    private static _instance: SuccessBehavior;
    public static get instance(): SuccessBehavior {
        if (!SuccessBehavior._instance) {
            SuccessBehavior._instance = new SuccessBehavior();
        }
        return SuccessBehavior._instance;
    }

    constructor(nextState: () => BehaviorState = undefined) {
        super(undefined, nextState);
    }
    public async act() {
      return;
    }

    public nextState(): BehaviorState {
        return this;
    }
}