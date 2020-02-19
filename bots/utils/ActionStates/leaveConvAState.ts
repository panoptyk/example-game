import { ActionState } from "../../lib/ActionStates/actionState";
import { Agent, ClientAPI, ValidationResult } from "panoptyk-engine/dist/";
import { SuccessAction } from "../../lib/ActionStates/successAState";

export class LeaveConersationState extends ActionState {
    private _completed = false;
    public get completed() {
        return this._completed;
    }

    constructor(nextState: () => ActionState = undefined) {
        super(nextState);
    }

    public async act() {
        if (ClientAPI.playerAgent.conversation) {
            await ClientAPI.leaveConversation()
            .catch((res: ValidationResult) => {
                console.log(res.message);
            })
            .then(() => {
                this._completed = true;
            });
        }
        else {
            this._completed = true;
        }
    }

    public nextState(): ActionState {
        if (this._completed) return SuccessAction.instance;
        else return this;
    }
}
