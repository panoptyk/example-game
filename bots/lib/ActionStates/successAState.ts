import { ActionState } from "./actionState";

/**
 * SuccessAction is an endcap for FSMs denoting it has completed.
 * It's singleton SuccessAction.instance can be used to save memory if no modifications required
 */
export class SuccessAction extends ActionState {
    // Singleton Pattern
    private static _instance: SuccessAction;
    public static get instance(): SuccessAction {
        if (!SuccessAction._instance) {
            SuccessAction._instance = new SuccessAction();
        }
        return SuccessAction._instance;
    }

    constructor(nextState: () => ActionState = undefined) {
        super(nextState);
    }
    public async act() {
      return;
    }

    public nextState(): ActionState {
        return this;
    }
}