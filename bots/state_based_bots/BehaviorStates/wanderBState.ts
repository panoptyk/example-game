import { BehaviorState } from "./behaviorState";

export class WanderBehavior extends BehaviorState {

  public nextState (): BehaviorState {
    return this;
  }

}