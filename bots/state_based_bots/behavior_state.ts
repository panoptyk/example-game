import { ActionState } from "./action_state";
import { IdleState } from "./ActionStates/idle_state";

export abstract class BehaviourState {

  public currentActionState: ActionState;

  constructor (initialState: ActionState) {
      this.currentActionState = initialState;
  }

  public async act () {
      await this.currentActionState.act ();
      this.currentActionState = this.currentActionState.nextState ();
  }

  public abstract nextBehavior (): BehaviourState;

}