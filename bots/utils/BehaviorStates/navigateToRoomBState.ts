import {
  ActionState,
  BehaviorState,
  SuccessAction,
  FailureAction
} from "../../lib";
import { ClientAPI, Room } from "panoptyk-engine/dist/";
import * as Helper from "../helper";
import {
  MoveState
} from "..";

export class NavigateToRoomBehavior extends BehaviorState {
  target: Room;

  private static _instance: NavigateToRoomBehavior;
  public static get instance(): NavigateToRoomBehavior {
    if (!this._instance) {
      this._instance = new NavigateToRoomBehavior();
    }
    return NavigateToRoomBehavior._instance;
  }

  public static start(targetRoom: Room, nextState?: () => BehaviorState) {
    this._instance = new NavigateToRoomBehavior(nextState);
    this._instance.target = targetRoom;
    this.instance.currentActionState = this.instance.getNextAction();
    return this.instance;
  }

  private getNextAction(): ActionState {
    if (ClientAPI.playerAgent.room === this.target) {
      return SuccessAction.instance;
    }
    // TODO: add better logic here later
    const neighbors = ClientAPI.playerAgent.room.getAdjacentRooms();
    if (neighbors.includes(this.target)) {
      return new MoveState(this.target, this.getNextAction);
    }
    return new MoveState(
      neighbors[Helper.randomInt(0, neighbors.length)],
      this.getNextAction
    );
  }

  public async act() {
    this.currentActionState = await this.currentActionState.tick();
  }

  public nextState(): BehaviorState {
    return this;
  }
}
