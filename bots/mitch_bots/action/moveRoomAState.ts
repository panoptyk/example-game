import { log } from "../util/log";
import DELAYS from "../util/humanDelay";
import { ActionState, SuccessAction } from "../../lib";
import { RetryActionState } from "./retryActionState";
import { Room, ClientAPI } from "panoptyk-engine/dist/client";

export class MoveRoomAction extends RetryActionState {
  _dest: Room;
  _timeToWait;
  _waitTime = 0;

  constructor(dest: Room, timeout = 5000, nextState?: () => ActionState) {
    super(timeout, nextState);
    this._dest = dest;
    this._timeToWait = DELAYS.getDelay("move-room");
  }

  async act() {
    this._waitTime += this.deltaTime;
    if (this._waitTime <= this._timeToWait) {
      return;
    }
    await ClientAPI.moveToRoom(this._dest).then(res => {
      log("Moved to room: " + this._dest, log.ACT);
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
