import { log } from "../util/log";
import DELAYS from "../util/humanDelay";
import { ActionState, SuccessAction } from "../../lib";
import { RetryActionState } from "./retryActionState";
import { Info, ClientAPI } from "panoptyk-engine/dist/client";

export class AskQuestionAction extends RetryActionState {
  _query: any;
  _timeToWait;
  _waitTime = 0;

  constructor(info: any, timeout = 2500, nextState?: () => ActionState) {
    super(timeout, nextState);
    this._query = info;
    this._timeToWait = DELAYS.getDelay("convo-action");
  }

  async act() {
    this._waitTime += this.deltaTime;
    if (this._waitTime <= this._timeToWait) {
      return;
    }
    await ClientAPI.askQuestion(this._query).then(res => {
      log("Asked a question in convo.", log.ACT);
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
