import {
  BehaviorState,
  ActionState,
  FailureAction,
  SuccessAction,
  KnowledgeBase
} from "../../../lib";
import { Agent, Room, ClientAPI } from "panoptyk-engine/dist/client";
import { DenyConversationAction } from "../Actions/denyConversationAction";
import { IdleAction } from "../Actions/idleAction";
import { MoveAction } from "../Actions/moveAction";

export class FollowBehavior extends BehaviorState {
  private static agentToFollow: Agent;
  private static roomToMoveTo: Room;
  private static denyConversationNeeded = false;

  constructor(nextState: () => BehaviorState) {
    super(nextState);
    this.currentActionState = new DenyConversationAction(
      FollowBehavior.denyConversationActionTransition
    );
  }

  public static get followedAgent(): Agent {
    return FollowBehavior.agentToFollow;
  }

  public static assignAgentToFollow(agent: Agent): void {
    FollowBehavior.agentToFollow = agent;
  }

  public static clearAgentToFollow(): void {
    FollowBehavior.agentToFollow = undefined;
    FollowBehavior.denyConversationNeeded = true;
  }

  public static get destinationRoom(): Room {
    return FollowBehavior.roomToMoveTo;
  }

  public static assignRoomToMoveTo(destination: Room): void {
    FollowBehavior.roomToMoveTo = destination;
    FollowBehavior.denyConversationNeeded = true;
  }

  public static finishedMoveToRoom(): void {
    FollowBehavior.roomToMoveTo = undefined;
  }

  public static get isDenyConversationNeeded(): boolean {
    return FollowBehavior.denyConversationNeeded;
  }

  public static conversationDenied(): void {
    FollowBehavior.denyConversationNeeded = false;
  }

  public static denyConversationActionTransition(
    this: DenyConversationAction
  ): ActionState {
    if (this.isConversationDenied) {
      if (FollowBehavior.agentToFollow !== undefined) {
        return new IdleAction(FollowBehavior.idleActionTransition);
      } else {
        return SuccessAction.instance;
      }
    }
    return this;
  }

  public static idleActionTransition(this: IdleAction): ActionState {
    if (FollowBehavior.isDenyConversationNeeded) {
      return new DenyConversationAction(
        FollowBehavior.denyConversationActionTransition
      );
    } else if (FollowBehavior.destinationRoom !== undefined) {
      return new MoveAction(
        FollowBehavior.moveActionTransition,
        FollowBehavior.destinationRoom
      );
    } else if (
      !ClientAPI.playerAgent.room
        .getAgents()
        .includes(FollowBehavior.agentToFollow) ||
      FollowBehavior.agentToFollow === undefined
    ) {
      return FailureAction.instance;
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
