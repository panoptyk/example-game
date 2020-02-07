import { ActionState } from "../action_state";
import { MoveState } from "./move_state";
import { ClientAPI, Room } from "panoptyk-engine/dist/client";

export class IdleState extends ActionState {

  public delay = 0;

  public async act() {
    return;
  }

  public nextState (): ActionState {
    return this;
  }


}