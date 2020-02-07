import { ActionState } from "../actionState";
import { MoveState } from "./moveAState";
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