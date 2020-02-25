import { ActionState } from "../../lib/ActionStates/actionState";
import { Agent, ClientAPI, ValidationResult } from "panoptyk-engine/dist/";
import { SuccessAction } from "../../lib/ActionStates/successAState";
import { FailureAction } from "../../lib/ActionStates/failureAState";

export class SetTradeState extends ActionState {
  _status: boolean;
  private _completed = false;
  public get completed() {
    return this._completed;
  }
  private _doneActing = false;
  public get doneActing() {
    return this._doneActing;
  }

  constructor(status: boolean, nextState: () => ActionState = undefined) {
    super(nextState);
    this._status = status;
  }

  public async act() {
    if (ClientAPI.playerAgent.trade) {
      if (
        ClientAPI.playerAgent.trade.getAgentReadyStatus(
          ClientAPI.playerAgent
        ) === this._status
      ) {
        this._completed = true;
        this._doneActing = true;
      } else {
        await ClientAPI.setTradeReadyStatus(this._status)
          .catch((res: ValidationResult) => {
            console.log(res.message);
          })
          .then(() => {
            this._completed = true;
            this._doneActing = true;
          });
      }
    } else {
      this._doneActing = true;
    }
  }

  public nextState(): ActionState {
    if (this._completed) return SuccessAction.instance;
    else if (this._doneActing) return FailureAction.instance;
    else return this;
  }
}
