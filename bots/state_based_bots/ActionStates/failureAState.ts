import { ActionState } from "../action_state";

/**
 * FailureAction is an endcap for Action FSMs denoting it has completed.
 * It's singleton FailureAction.instance can be used to save memory if no modifications required
 */
export class FailureAction extends ActionState {
    // Singleton Pattern
    private static _instance: FailureAction;
    public static get instance(): FailureAction {
        if (!FailureAction._instance) {
            FailureAction._instance = new FailureAction();
        }
        return FailureAction._instance;
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