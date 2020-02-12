import { BehaviorState, ActionState } from "../../../lib";
import { IdleAction } from "../Actions/idleAction";

export class IdleBehavior extends BehaviorState {
  constructor (nextState: () => BehaviorState) {
    super (nextState);
    this.currentActionState = new IdleAction (IdleBehavior.idleActionTransition);
  }

  public static idleActionTransition (this: IdleAction): ActionState {
    return this;
  }

  public nextState(): BehaviorState {
    return undefined;
  }
}
