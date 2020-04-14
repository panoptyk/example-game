import { ActionState, SuccessAction, FailureAction } from "../../lib";
import DELAYS from "../util/humanDelay";
import { RetryActionState } from "./retryActionState";
import { Agent, ClientAPI } from "panoptyk-engine/dist/client";
import { log } from "../util/log";

/**
 * very custom do not use regularly
 */
export class RequestTradeAction extends RetryActionState {
  _target: Agent;
  _timeToWait: number;

  constructor(target: Agent, timeout = 2000, nextState?: () => ActionState) {
    super(timeout, nextState);
    this._target = target;
    this._timeToWait = DELAYS.getDelay("request-trade");
  }

  async act() {
    if ((Date.now() - this.startTime) < this._timeToWait) {
      return;
    }
    await ClientAPI.requestTrade(this._target).then(res => {
      log("Requested trade with: " + this._target, log.ACT);
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

  async tick() {
    const state = await super.tick();
    // need it only to pass success
    return state === FailureAction.instance ? SuccessAction.instance : state;
  }


}