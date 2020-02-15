import { BehaviorState, KnowledgeBase, SuccessAction, ActionState } from "../../../lib";
import { ClientAPI, Room } from "panoptyk-engine/dist/client";
import { MoveAction } from "../Actions/moveAction";

export class MapBehavior extends BehaviorState {
  public static destination: Room;
  public static path: Room[];
  public static pathPos = 0;

  constructor(nextState: () => BehaviorState) {
    super(nextState);
    this.currentActionState = new MoveAction(
      MapBehavior.moveActionTransition,
      MapBehavior.path[MapBehavior.pathPos]
    );
  }

  public static assignNewDestinationRoom(newDest: Room): void {
    MapBehavior.destination = newDest;
    MapBehavior.path = KnowledgeBase.instance.roomMap.findPath(
      ClientAPI.playerAgent.room,
      MapBehavior.destination
    );
    MapBehavior.pathPos = 0;
  }

  public static moveActionTransition(this: MoveAction): ActionState {
    if (
      this.isMoveCompleted &&
      this.moveDestination === MapBehavior.destination
    ) {
      return SuccessAction.instance;
    } else if (this.isMoveCompleted) {
      MapBehavior.pathPos++;
      return new MoveAction(
        MapBehavior.moveActionTransition,
        MapBehavior.path[MapBehavior.pathPos]
      );
    }
    return this;
  }
  public nextState(): BehaviorState {
    return undefined;
  }
}
