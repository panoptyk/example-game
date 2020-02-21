import { ActionState } from "../../../lib";
import { Room, ClientAPI, ValidationResult } from "panoptyk-engine/dist/client";
import { FollowBehavior } from "../Behaviors/followBehavior";

export class MoveAction extends ActionState {
  private destination: Room;
  private moveCompleted = false;

  public get isMoveCompleted(): boolean {
    return this.moveCompleted;
  }

  public get moveDestination(): Room {
    return this.destination;
  }

  constructor(nextState: () => ActionState, destination: Room) {
    super(nextState);
    this.destination = destination;
  }

  public async act() {
    await ClientAPI.moveToRoom(this.destination)
      .catch((res: ValidationResult) => {
        console.log(res.message);
      })
      .then(() => {
        console.log("Moved to " + this.destination);
        this.moveCompleted = true;
        FollowBehavior.finishedMoveToRoom();
      });
  }

  public nextState(): ActionState {
    return undefined;
  }
}
