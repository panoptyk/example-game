import { ActionState } from "../action_state";
import { MoveState } from "./move_state";
import { ClientAPI, Room } from "panoptyk-engine/dist/client";

export class IdleState extends ActionState {

  private delay = 0;

  public async act() {
    return;
  }

  public nextState (): ActionState {
    if (Math.random () * 1000 < this.delay) {
      const adjacentRooms: Room[] = ClientAPI.playerAgent.room.getAdjacentRooms ();
      return new MoveState (adjacentRooms [Math.floor (Math.random () * adjacentRooms.length)]);
    } else {
      this.delay++;
      return this;
    }
  }


}