import { log } from "../util/log";
import { ActionState, SuccessAction } from "../../lib";
import { RetryActionState } from "./retryActionState";
import { Room, ClientAPI } from "panoptyk-engine/dist/client";

export class MoveRoomAction extends RetryActionState {
  _dest: Room;
  _success = false;

  constructor(dest: Room, timeOut = 5000, nextState?: () => ActionState) {
    super(timeOut, nextState);
    this._dest = dest;
  }

  async act() {
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
