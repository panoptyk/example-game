import { ActionState } from "../lib/ActionStates/actionState";
import { Room, ClientAPI, ValidationResult } from "panoptyk-engine/dist/client";
import { SuccessAction } from "../lib/ActionStates/successAState";

export class MoveState extends ActionState {
  private destination: Room;
  private completed = false;

  constructor(dest: Room, nextState: () => ActionState = undefined) {
    super(nextState);
    this.destination = dest;
  }

  public successfullyMoved() {
    return this.completed;
  }

  public async act() {
    await ClientAPI.moveToRoom(this.destination)
      .catch((res: ValidationResult) => {
        console.log (res.message);
      })
      .then(() => {
        console.log ("Moved to " + this.destination);
        this.completed = true;
      });
  }

  public nextState(): ActionState {
    return SuccessAction.instance;
  }
}
