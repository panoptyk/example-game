import { ActionState, SuccessAction, FailureAction } from "../../lib";
import DELAYS from "../util/humanDelay";
import { log } from "../util/log";
import * as KB from "../kb/KBadditions";
import { RetryActionState } from "./retryActionState";
import { ClientAPI, Agent } from "panoptyk-engine/dist/client";

export class EnterConvoAction extends RetryActionState {
  _target: Agent;
  _timeToWait: number;
  _waitTime = 0;
  _requested = false;

  constructor(target: Agent, timeout = 10000, nextState?: () => ActionState) {
    super(timeout, nextState);
    this._target = target;
    this._timeToWait = DELAYS.getDelay("request-convo");
    this._fail = !this._target;
    this._success = KB.get.otherAgentInConvo() === this._target;
  }

  async act() {
    this._waitTime += this.deltaTime;
    this._success = KB.get.otherAgentInConvo() === this._target;
    this._fail =
      !KB.is.agentInRoom(this._target) ||
      (this._requested && !KB.is.convoRequestedWith(this._target));
    if (
      !this._complete &&
      !this._requested &&
      this._waitTime >= this._timeToWait
    ) {
      await ClientAPI.requestConversation(this._target).then(res => {
        log("Requested conversation with " + this._target, log.ACT);
        this._waitTime = 0;
        this._requested = true;
      });
    }
  }

  nextState(): ActionState {
    if (this._fail) {
      return FailureAction.instance;
    } else if (this._success) {
      return SuccessAction.instance;
    } else {
      return this;
    }
  }
}
