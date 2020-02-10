import { BehaviorState } from "../lib/BehaviorStates/behaviorState";

export class WanderBehavior extends BehaviorState {

  public nextState (): BehaviorState {
    return this;
  }

}