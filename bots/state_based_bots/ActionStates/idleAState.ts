import { ActionState } from "./actionState";

export class IdleState extends ActionState {

  public delay = 0;

  public async act() {
    return;
  }

  public nextState (): ActionState {
    return this;
  }


}