import {
  BehaviorState,
  State,
  SuccessBehavior,
  SuccessAction,
  FailureBehavior,
  FailureAction,
  ActionState
} from "../../lib";
import { log } from "../util/log";
import * as KB from "../kb/KBadditions";
import { Room } from "panoptyk-engine/dist/client";
import { MoveRoomAction } from "../action/moveRoomAState";

export class MoveToRoomBehavior extends BehaviorState {
  _destination: Room;
  _arrivedAtRoom = false;
  _path: Room[];
  _prevPos = 0;
  _pathPos = 0;

  constructor(targetRoom: Room, nextState?: () => State) {
    super(nextState);
    this._destination = targetRoom;
    this._path = KB.roomMap.findPath(KB.get.curRoom, targetRoom);
    this._fail =
      !this._destination || !this._path || this._pathPos >= this._path.length;
    if (!this._fail) {
      log("Planning to move to room: " + this._destination, log.ACT);
      this.currentActionState = new MoveRoomAction(
        this._path[this._pathPos],
        12000,
        MoveToRoomBehavior.createMoveActionTransition(this)
      );
    } else {
      this.currentActionState = FailureAction.instance;
    }
  }

  async act() {
    await super.act();
    // Check flags
    this._arrivedAtRoom =
      KB.get.curRoom && KB.get.curRoom.id === this._destination.id;
    this._fail = this.currentActionState === FailureAction.instance;
  }

  nextState(): BehaviorState {
    if (this._arrivedAtRoom) {
      return SuccessBehavior.instance;
    } else if (this._fail) {
      return FailureBehavior.instance;
    } else {
      return this;
    }
  }

  static createMoveActionTransition(
    state: MoveToRoomBehavior
  ): (this: MoveRoomAction) => ActionState {
    return function(this: MoveRoomAction) {
      if (this._success) {
        state._pathPos++;
        return new MoveRoomAction(
          state._path[state._pathPos],
          15000,
          MoveToRoomBehavior.createMoveActionTransition(state)
        );
      } else {
        return this;
      }
    };
  }
}
