import { BehaviorState } from "./behaviorState";

export class IdleBehavior extends BehaviorState {

  public nextState (): BehaviorState {
    return this;
  }

}