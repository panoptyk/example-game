import {
  Strategy,
  BehaviorState,
  FailureAction,
  KnowledgeBase
} from "../../lib";
import { FollowBehavior } from "./Behaviors/followBehavior";
import { IdleBehavior } from "./Behaviors/idleBehavior";
import { ClientAPI, Info, Agent, Room } from "panoptyk-engine/dist/client";
import { UpdatedModels } from "panoptyk-engine/dist/clientAPI";
import { DenyConversationAction } from "./Actions/denyConversationAction";

export class FollowStrategy extends Strategy {
  constructor() {
    super();
    this.currentBehavior = new IdleBehavior(FollowStrategy.idleBehaviorTransition);

    ClientAPI.addOnUpdateListener(FollowStrategy.moveRoomUpdateListener);
  }

  public static moveRoomUpdateListener(updates: UpdatedModels) {
    const updatedInfo: Info[] = updates.Info;
    updatedInfo.forEach(info => {
      if (
        info.action === Info.ACTIONS.MOVE.name &&
        Agent.getByID(info.agents[0]) === FollowBehavior.followedAgent &&
        Room.getByID(info.locations [0]) === ClientAPI.playerAgent.room
      ) {
        if (FollowBehavior.destinationRoom === undefined) {
          FollowBehavior.assignRoomToMoveTo(Room.getByID(info.locations [1]));
        }
      }
    });
  }

  public static followBehaviorTransition(this: FollowBehavior): BehaviorState {
    if (this.currentActionState === FailureAction.instance) {
      return new IdleBehavior(FollowStrategy.idleBehaviorTransition);
    } else if (ClientAPI.playerAgent.conversationRequesters.length > 0) {
      const requestingAgent = ClientAPI.playerAgent.conversationRequesters[0];
      if (requestingAgent !== undefined && requestingAgent === FollowBehavior.followedAgent && !(this.currentActionState instanceof DenyConversationAction)) {
        FollowBehavior.clearAgentToFollow();
        return new IdleBehavior(FollowStrategy.idleBehaviorTransition);
      } else {
        FollowBehavior.assignAgentToFollow(requestingAgent);
        return new FollowBehavior(FollowStrategy.followBehaviorTransition);
      }
    }
    return this;
  }

  public static idleBehaviorTransition(this: IdleBehavior): BehaviorState {
    if (ClientAPI.playerAgent.conversationRequesters.length > 0) {
      FollowBehavior.assignAgentToFollow(ClientAPI.playerAgent.conversationRequesters [0]);
      return new FollowBehavior(FollowStrategy.followBehaviorTransition);
    }
    return this;
  }
}
