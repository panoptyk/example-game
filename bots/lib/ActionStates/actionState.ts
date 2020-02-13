import { State } from "../state";

export abstract class ActionState extends State {

  constructor(nextState: () => ActionState = undefined) {
    super(nextState);
  }

  public abstract nextState(): ActionState;

  public async tick (): Promise<ActionState> {
    return (await super.tick () as any);
  }

}