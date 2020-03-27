import { log } from "../util/log";
import DELAYS from "../util/humanDelay";
import { ActionState, SuccessAction } from "../../lib";
import { RetryActionState } from "./retryActionState";
import { Item, ClientAPI } from "panoptyk-engine/dist/client";

export class PassOnRequestAction extends RetryActionState {
  _request: any;
  _isItem = false;
  _timeToWait;
  _waitTime = 0;

  constructor(req: any, timeout = 750, nextState?: () => ActionState) {
    super(timeout, nextState);
    this._request = req;
    this._isItem = this._request instanceof Item;
    this._timeToWait = DELAYS.getDelay("trade-action");
  }

  async act() {
    this._waitTime += this.deltaTime;
    if (this._waitTime <= this._timeToWait) {
      return;
    }
    if (this._isItem) {
      await ClientAPI.passItemRequestTrade(this._request).then(res => {
        log("Passed on requested item in trade: " + this._request, log.ACT);
        this._success = true;
      });
    } else {
      await ClientAPI.passInfoRequestTrade(this._request).then(res => {
        log("Passed on requested answer to question in trade: " + this._request, log.ACT);
        this._success = true;
      });
    }
  }
  nextState(): ActionState {
    if (this._success) {
      return SuccessAction.instance;
    } else {
      return this;
    }
  }
}
