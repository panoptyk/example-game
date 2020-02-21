import { BehaviorState, ActionState, FailureAction } from "../../../lib";
import { Agent, Room, ClientAPI } from "panoptyk-engine/dist/client";
import { DenyConversationAction } from "../Actions/denyConversationAction";
import { IdleAction } from "../Actions/idleAction";
import { MoveAction } from "../Actions/moveAction";

export class FollowBehavior extends BehaviorState {
  private static agentToFollow: Agent;
  private static roomToMoveTo: Room;

  constructor(nextState: () => BehaviorState) {
    super(nextState);
    this.currentActionState = new DenyConversationAction(FollowBehavior.denyConversationActionTransition);
  }

  public static get followedAgent(): Agent {
    return FollowBehavior.agentToFollow;
  }

  public static assignAgentToFollow(agent: Agent): void {
    console.log ("assigned " + agent);
    FollowBehavior.agentToFollow = agent;
  }

  public static clearAgentToFollow(): void {
    console.log ("cleared");
    FollowBehavior.agentToFollow = undefined;
  }

  public static get destinationRoom(): Room {
    return FollowBehavior.roomToMoveTo;
  }

  public static assignRoomToMoveTo(destination: Room): void {
    FollowBehavior.roomToMoveTo = destination;
  }

  public static finishedMoveToRoom(): void {
    FollowBehavior.roomToMoveTo = undefined;
  }

  public static denyConversationActionTransition(
    this: DenyConversationAction
  ): ActionState {
    if (this.isConversationDenied) {
      return new IdleAction(FollowBehavior.idleActionTransition);
    }
    return this;
  }

  public static idleActionTransition(this: IdleAction): ActionState {
    if (
      !ClientAPI.playerAgent.room
        .getAgents()
        .includes(FollowBehavior.agentToFollow)
    ) {
      return FailureAction.instance;
    } else if (FollowBehavior.destinationRoom !== undefined) {
      return new MoveAction(
        FollowBehavior.moveActionTransition,
        FollowBehavior.destinationRoom
      );
    }
    return this;
  }

  public static moveActionTransition(this: MoveAction): ActionState {
    if (this.isMoveCompleted) {
      return new IdleAction(FollowBehavior.idleActionTransition);
    }
    return this;
  }

  public nextState(): BehaviorState {
    return undefined;
  }
}
