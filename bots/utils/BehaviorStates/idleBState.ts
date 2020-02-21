import {
  BehaviorState,
} from "../../lib";
import {
  IdleState,
} from "../";

export class IdleBehavior extends BehaviorState {
  constructor(nextState?: () => BehaviorState) {
    super(nextState);
      this.currentActionState = new IdleState();
  }

  public async act() {
    this.currentActionState = await this.currentActionState.tick();
  }

  public nextState() {
    return this;
  }
}
