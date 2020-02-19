import { ActionState } from "../../lib/ActionStates/actionState";
import { Agent, ClientAPI, ValidationResult } from "panoptyk-engine/dist/";
import { SuccessAction } from "../../lib/ActionStates/successAState";
import { FailureAction } from "../../lib/ActionStates/failureAState";

export class RequestTradeState extends ActionState {
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
        if (ClientAPI.playerAgent.conversation &&
        ClientAPI.playerAgent.conversation.contains_agent(this.targetAgent)) {
            await ClientAPI.requestTrade(this.targetAgent)
            .catch((res: ValidationResult) => {
                console.log(res.message);
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
