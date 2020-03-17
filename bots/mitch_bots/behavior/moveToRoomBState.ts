import {
  BehaviorState,
  State,
  SuccessBehavior,
  SuccessAction,
  FailureBehavior,
  FailureAction
} from "../../lib";
import * as KB from "../kb/KBadditions";
import { Room } from "panoptyk-engine/dist/client";
import { MoveRoomAction } from "../action/moveRoomAState";

export class MoveToRoomBehavior extends BehaviorState {
  _destination: Room;
  _arrivedAtRoom = false;
  _error = false;
  _path: Room[];
  _pathPos = 0;

  constructor(targetRoom: Room, nextState?: () => State) {
    super(nextState);
    this._destination = targetRoom;
    this._path = KB.roomMap.findPath(KB.get.curRoom, targetRoom);
    if (!(this._error = this._pathPos >= this._path.length)) {
      this.currentActionState = new MoveRoomAction(this._path[this._pathPos]);
    } else {
      this.currentActionState = FailureAction.instance;
    }
  }

  async act() {
    await super.act();
    // Check if arrived at room
    this._arrivedAtRoom =
      KB.get.curRoom && KB.get.curRoom.id === this._destination.id;
    if (
      !this._arrivedAtRoom &&
      this.currentActionState === SuccessAction.instance &&
      !(this._error = ++this._pathPos >= this._path.length) // check if something went wrong
    ) {
      this.currentActionState = new MoveRoomAction(this._path[this._pathPos]);
    }
    this._error = this.currentActionState === FailureAction.instance;
  }

  nextState(): BehaviorState {
    if (this._arrivedAtRoom) {
      return SuccessBehavior.instance;
    } else if (this._error) {
      return FailureBehavior.instance;
    } else {
      return this;
    }
  }
}
