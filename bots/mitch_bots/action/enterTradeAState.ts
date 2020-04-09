import { ActionState, SuccessAction, FailureAction } from "../../lib";
import DELAYS from "../util/humanDelay";
import { log } from "../util/log";
import * as KB from "../kb/KBadditions";
import { RetryActionState } from "./retryActionState";
import { ClientAPI, Agent } from "panoptyk-engine/dist/client";

export class EnterTradeAction extends RetryActionState {
  _target: Agent;
  _timeToWait: number;
  _waitTime = 0;
  _requested = false;

  constructor(target: Agent, timeout = 1000, nextState?: () => ActionState) {
    super(timeout, nextState);
    this._target = target;
    this._success = KB.get.otherAgentInTrade() === this._target;
    this._timeToWait = DELAYS.getDelay("request-trade");
  }

  async act() {
    this._waitTime += this.deltaTime;
    this._fail =
      KB.get.otherAgentInConvo() !== this._target ||
      !KB.is.agentInRoom(this._target) ||
      (this._requested && !KB.is.tradeRequestedWith(this._target));
    this._success = KB.get.otherAgentInTrade() === this._target;
    if (
      !this._complete &&
      !this._requested &&
      this._waitTime >= this._timeToWait
    ) {
      await ClientAPI.requestTrade(this._target).then(res => {
        log("Requested trade with " + this._target, log.ACT);
        this._waitTime = 0;
        this._requested = true;
      });
    }
  }

  nextState(): ActionState {
    if (this._success) {
      return SuccessAction.instance;
    } else if (this._fail) {
      return FailureAction.instance;
    } else {
      return this;
    }
  }
}
