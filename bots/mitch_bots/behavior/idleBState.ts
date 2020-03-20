import { BehaviorState, SuccessAction } from "../../lib";

export class IdleBehavior extends BehaviorState {
  // Singleton
  static _instance: IdleBehavior;
  static get instance(): IdleBehavior {
    if (!IdleBehavior._instance) {
      IdleBehavior._instance = new IdleBehavior();
    }
    return IdleBehavior._instance;
  }

  constructor(nextState?: () => BehaviorState) {
    super(nextState);
    this.currentActionState = SuccessAction.instance;
  }

  async act() {
    // NO OP
  }

  nextState(): BehaviorState {
    return this;
  }

}