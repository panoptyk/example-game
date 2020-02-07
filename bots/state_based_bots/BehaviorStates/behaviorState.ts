import { State } from "../state";
import { ActionState } from "../ActionStates/actionState";

export abstract class BehaviorState extends State {

  public currentActionState: ActionState;

  constructor (initialState: ActionState, nextState: () => BehaviorState = undefined) {
    super(nextState);
    this.currentActionState = initialState;
  }

  public async act () {
      this.currentActionState = await this.currentActionState.tick();
  }

  public abstract nextState (): BehaviorState;

}