import { ActionState, SuccessAction } from "../../lib";
import DELAYS from "../util/humanDelay";
import * as KB from "../kb/KBadditions";
import { RetryActionState } from "./retryActionState";
import { ClientAPI, Agent } from "panoptyk-engine/dist/client";
import { log } from "../util/log";

export class LeaveConvoAction extends RetryActionState {
  _timeToWait: number;

  constructor(ignore?: Agent, timeout = 2000, nextState?: () => ActionState) {
    super(timeout, nextState);
    this._timeToWait = DELAYS.getDelay("leave-convo-trade");
    this._success =
      ClientAPI.playerAgent.conversation === undefined ||
      KB.get.otherAgentInConvo().id === (ignore ? ignore.id : 0);
  }

  async act() {
    this._success =
      this._success || ClientAPI.playerAgent.conversation === undefined;
    if (this._complete || Date.now() - this.startTime < this._timeToWait) {
      return;
    }
    await ClientAPI.leaveConversation().then(res => {
      log("Left conversation/trade", log.ACT);
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
