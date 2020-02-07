import { BehaviourState } from "../behavior_state";

export class IdleBehavior extends BehaviourState {

  public nextBehavior (): BehaviourState {
    return this;
  }

}