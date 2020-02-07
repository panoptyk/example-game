import { State } from "./state";

export abstract class ActionState extends State {

  constructor(nextState: () => ActionState = undefined) {
    super(nextState);
  }

  public async act () {
    return;
  }

  public abstract nextState(): ActionState;

}