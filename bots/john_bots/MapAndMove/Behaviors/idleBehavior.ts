import { BehaviorState } from "../../../lib";

export class IdleBehavior extends BehaviorState {
  public nextState(): BehaviorState {
    return undefined;
  }
}
