import { ActionState } from "./actionState";
import { Agent, ClientAPI, ValidationResult } from "panoptyk-engine/dist/client";
import { SuccessAction } from "./successAState";
import { FailureAction } from "./failureAState";

export class RequestConersationState extends ActionState {
    private targetAgent: Agent;
    private _completed = false;
    public get completed() {
        return this._completed;
    }
    private _impossible = false;
    public get impossible() {
        return this._impossible;
    }

    constructor(targetAgent: Agent, nextState: () => ActionState = undefined) {
        super(nextState);
        this.targetAgent = targetAgent;
    }

    public async act() {
        if (ClientAPI.playerAgent.room.hasAgent(this.targetAgent) &&
        !this.targetAgent.conversation) {
            await ClientAPI.requestConversation(this.targetAgent)
            .catch((res: ValidationResult) => {
                console.log (res.message);
            })
            .then(() => {
                this._completed = true;
            });
        }
        else {
            this._impossible = true;
        }
    }

    public nextState(): ActionState {
        if (this._completed) return SuccessAction.instance;
        else if (this._impossible) return FailureAction.instance;
        else return this;
    }
}
