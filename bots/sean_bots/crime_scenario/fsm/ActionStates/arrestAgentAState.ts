import { ActionState, SuccessAction, FailureAction } from "../../../../lib";
import { ClientAPI, Agent } from "panoptyk-engine/dist/";

export class PoliceArrestAgentState extends ActionState {
  private targetAgent: Agent;
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
    this.targetAgent = targetAgent;
  }

  public async act() {
    if (ClientAPI.playerAgent.room.hasAgent(this.targetAgent)) {
      await ClientAPI.arrestAgent(this.targetAgent);
      this._completed = true;
      this._doneActing = true;
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
