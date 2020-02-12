import { BehaviorState, SuccessAction, ActionState } from "../../../lib";
import { Room } from "panoptyk-engine/dist/client";
import { TalkBehavior } from "./talkBehavior";
import { MoveAction } from "../Actions/moveAction";

export class MoveBehavior extends BehaviorState {
  public static destination: Room;

  constructor(nextState: () => BehaviorState) {
    super(nextState);
    MoveBehavior.destination = TalkBehavior.useRoom();
  }

  public static moveActionTransition(this: MoveAction): ActionState {
    if (
      this.isMoveCompleted &&
      this.moveDestination === MoveBehavior.destination
    ) {
      return SuccessAction.instance;
    } else if (this.isMoveCompleted) {
      return new MoveAction(MoveBehavior.moveActionTransition, undefined); // TODO: KnowledgeBase pathfinding tie in here
    }
    return this;
  }

  public nextState(): BehaviorState {
    return undefined;
  }
}
