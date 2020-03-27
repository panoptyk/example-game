import { log } from "../util/log";
import DELAYS from "../util/humanDelay";
import { ActionState, SuccessAction } from "../../lib";
import { RetryActionState } from "./retryActionState";
import { Info, ClientAPI } from "panoptyk-engine/dist/client";

export class TellInfoAction extends RetryActionState {
  _info: Info;
  _timeToWait;
  _waitTime = 0;

  constructor(info: Info, timeout = 2500, nextState?: () => ActionState) {
    super(timeout, nextState);
    this._info = info;
    this._timeToWait = DELAYS.getDelay("convo-action");
  }

  async act() {
    this._waitTime += this.deltaTime;
    if (this._waitTime <= this._timeToWait) {
      return;
    }
    await ClientAPI.tellInfo(this._info).then(res => {
      log("Told info in convo: " + this._info, log.ACT);
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
