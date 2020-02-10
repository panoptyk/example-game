import { ActionState } from "../lib/ActionStates/actionState";

export class IdleState extends ActionState {

  public delay = 0;

  public async act() {
    return;
  }

  public nextState (): ActionState {
    return this;
  }


}