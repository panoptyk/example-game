import { BehaviorState, KnowledgeBase, SuccessAction, ActionState, FailureAction } from "../../../lib";
import { ClientAPI, Room } from "panoptyk-engine/dist/client";
import { MoveAction } from "../Actions/moveAction";
import { ExploreRoomAction } from "../Actions/exploreRoomAction";

export class MapBehavior extends BehaviorState {
  public static destination: Room;
  public static path: Room[];
  public static pathPos = 0;

  constructor(nextState: () => BehaviorState) {
    super(nextState);
    this.currentActionState = new ExploreRoomAction (MapBehavior.exploreRoomActionTransition);
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
      return new ExploreRoomAction (MapBehavior.exploreRoomActionTransition);
    } else if (this.isMoveCompleted) {
      MapBehavior.pathPos++;
      if (MapBehavior.pathPos > MapBehavior.path.length) {
        return FailureAction.instance;
      }
      return new MoveAction(
        MapBehavior.moveActionTransition,
        MapBehavior.path[MapBehavior.pathPos]
      );
    }
    return this;
  }

  public static exploreRoomActionTransition(this: ExploreRoomAction): ActionState {
    if (this.isExplored) {
      const roomsToExplore = KnowledgeBase.instance.roomMap.checkForUnexploredRooms ();
      if (roomsToExplore.length > 0) {
        MapBehavior.assignNewDestinationRoom (roomsToExplore [0]);
        return new MoveAction(MapBehavior.moveActionTransition, MapBehavior.path[MapBehavior.pathPos]);
      } else {
        return SuccessAction.instance;
      }
    }
    return this;
  }

  public nextState(): BehaviorState {
    return undefined;
  }
}
