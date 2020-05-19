import { log } from "../util/log";
import DELAYS from "../util/humanDelay";
import Sentance from "../util/sentence";
import { ActionState, SuccessAction } from "../../lib";
import { RetryActionState } from "./retryActionState";
import { Item, ClientAPI } from "panoptyk-engine/dist/client";

export class RequestInTradeAction extends RetryActionState {
  _request: any;
  _isItem = false;
  _timeToWait;
  _waitTime = 0;

  constructor(req: any, timeout = 4000, nextState?: () => ActionState) {
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
      await ClientAPI.requestItemTrade(this._request).then(res => {
        log("Requested item in trade: " + this._request, log.ACT);
        this._success = true;
      });
    } else {
      await ClientAPI.requestAnswerTrade(this._request).then(res => {
        const sentance = Sentance.fromInfo(this._request).reduce((a, b) => a + b.text, "");
        log("Requested answer to question in trade: " + sentance + this._request, log.ACT);
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
