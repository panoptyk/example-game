export abstract class ActionState {

  public async abstract act ();

  public abstract nextState(): ActionState;

}