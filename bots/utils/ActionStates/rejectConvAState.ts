import { ActionState } from "../../lib/ActionStates/actionState";
import { Agent, ClientAPI, ValidationResult } from "panoptyk-engine/dist/";
import { SuccessAction } from "../../lib/ActionStates/successAState";
import { FailureAction } from "../../lib/ActionStates/failureAState";

export class RejectConersationState extends ActionState {
    private _targetAgent: Agent;
    public get targetAgent(): Agent {
        return this._targetAgent;
    }
    private _completed = false;
    public get completed() {
        return this._completed;
    }
    private _doneActing = false;
    public get doneActing() {
        return this._doneActing;
    }

    constructor(targetAgent: Agent, nextState: () => ActionState = undefined) {
        super(nextState);
        this._targetAgent = targetAgent;
    }

    public async act() {
        if (ClientAPI.playerAgent.conversationRequesters.includes(this.targetAgent)) {
            await ClientAPI.rejectConversation(this.targetAgent)
            .catch((res: ValidationResult) => {
                console.log(res.message);
            })
            .then(() => {
                this._completed = true;
                this._doneActing = true;
            });
        }
        else {
            this._doneActing = true;
        }
    }

    public nextState(): ActionState {
        if (this._completed) return SuccessAction.instance;
        else if (this._doneActing) return FailureAction.instance;
        else return this;
    }
}
