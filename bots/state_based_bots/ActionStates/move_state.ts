import { ActionState } from "../action_state";
import { Room, ClientAPI, ValidationResult } from "panoptyk-engine/dist/client";
import { IdleState } from "./idle_state";

export class MoveState extends ActionState {
  private destination: Room;
  private completed = false;

  constructor(dest: Room) {
    super();
    this.destination = dest;
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
    if (this.completed) {
      return new IdleState();
    }
    return this;
  }
}
