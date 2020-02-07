import { BehaviorState } from "../behavior_state";

export class IdleBehavior extends BehaviorState {

  public nextState (): BehaviorState {
    return this;
  }

}