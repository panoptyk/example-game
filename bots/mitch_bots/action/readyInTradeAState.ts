import { log } from "../util/log";
import DELAYS from "../util/humanDelay";
import { ActionState, SuccessAction } from "../../lib";
import { RetryActionState } from "./retryActionState";
import { ClientAPI } from "panoptyk-engine/dist/client";

export class ReadyInTradeAction extends RetryActionState {
  _timeToWait;
  _waitTime = 0;

  constructor(timeout = 500, nextState?: () => ActionState) {
    super(timeout, nextState);
    this._timeToWait = DELAYS.getDelay("trade-action");
  }

  async act() {
    this._waitTime += this.deltaTime;
    if (this._waitTime <= this._timeToWait) {
      return;
    }
    await ClientAPI.setTradeReadyStatus(true).then(res => {
      log("Set ready in trade", log.ACT);
      this._success = true;
    });
  }
  nextState(): ActionState {
    if (this._success) {
      return SuccessAction.instance;
    } else {
      return this;
    }
  }
}
