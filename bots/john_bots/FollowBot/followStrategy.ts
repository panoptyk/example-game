import {
  Strategy,
  BehaviorState,
  FailureAction,
  KnowledgeBase,
  SuccessAction
} from "../../lib";
import { FollowBehavior } from "./Behaviors/followBehavior";
import { IdleBehavior } from "./Behaviors/idleBehavior";
import { ClientAPI, Info, Agent, Room } from "panoptyk-engine/dist/client";
import { UpdatedModels } from "panoptyk-engine/dist/clientAPI";
import { DenyConversationAction } from "./Actions/denyConversationAction";

export class FollowStrategy extends Strategy {
  constructor() {
    super();
    this.currentBehavior = new IdleBehavior(
      FollowStrategy.idleBehaviorTransition
    );

    ClientAPI.addOnUpdateListener(FollowStrategy.moveRoomUpdateListener);
  }

  public static moveRoomUpdateListener(updates: UpdatedModels) {
    const updatedInfo: Info[] = updates.Info;
    updatedInfo.forEach(info => {
      if (
        info.action === Info.ACTIONS.MOVE.name &&
        Agent.getByID(info.agents[0]) === FollowBehavior.followedAgent &&
        Room.getByID(info.locations[0]) === ClientAPI.playerAgent.room
      ) {
        if (FollowBehavior.destinationRoom === undefined) {
          FollowBehavior.assignRoomToMoveTo(Room.getByID(info.locations[1]));
        }
      }
    });
  }

  public static followBehaviorTransition(this: FollowBehavior): BehaviorState {
    if (
      this.currentActionState === FailureAction.instance ||
      this.currentActionState === SuccessAction.instance
    ) {
      return new IdleBehavior(FollowStrategy.idleBehaviorTransition);
    } else if (
      KnowledgeBase.instance.isConversationRequested() &&
      !FollowBehavior.isDenyConversationNeeded
    ) {
      const requestingAgent = ClientAPI.playerAgent.conversationRequesters[0];
      if (requestingAgent === FollowBehavior.followedAgent) {
        FollowBehavior.clearAgentToFollow();
      } else {
        FollowBehavior.assignAgentToFollow(requestingAgent);
        return new FollowBehavior(FollowStrategy.followBehaviorTransition);
      }
    }
    return this;
  }

  public static idleBehaviorTransition(this: IdleBehavior): BehaviorState {
    if (
      ClientAPI.playerAgent.room
        .getAgents()
        .includes(FollowBehavior.followedAgent)
    ) {
      return new FollowBehavior(FollowStrategy.followBehaviorTransition);
    }
    if (KnowledgeBase.instance.isConversationRequested()) {
      FollowBehavior.assignAgentToFollow(
        ClientAPI.playerAgent.conversationRequesters[0]
      );
      return new FollowBehavior(FollowStrategy.followBehaviorTransition);
    }
    return this;
  }
}
