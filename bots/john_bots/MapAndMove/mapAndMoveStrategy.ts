import {
  Strategy,
  KnowledgeBase,
  BehaviorState,
  SuccessAction,
  FailureAction
} from "../../lib";
import { UpdatedModels, ClientAPI } from "panoptyk-engine/dist/clientAPI";
import { Agent } from "panoptyk-engine/dist/client";
import { MoveBehavior } from "./Behaviors/moveBehavior";
import { TalkBehavior } from "./Behaviors/talkBehavior";
import { IdleBehavior } from "./Behaviors/idleBehavior";
import { MapBehavior } from "./Behaviors/mapBehavior";

export class MapAndMoveStrategy extends Strategy {
  constructor() {
    super();

    ClientAPI.addOnUpdateListener(this.conversationRequestCallback);
    ClientAPI.addOnUpdateListener(this.reciveRoomInfoCallback);
  }

  public conversationRequestCallback(updates: UpdatedModels): void {
    const agents: Agent[] = updates.Agent;
    agents.forEach(agent => {
      if (agent === ClientAPI.playerAgent) {
        if (agent.conversationRequested.length > 0) {
          KnowledgeBase.instance.conversationRequested();
        }
      }
    });
  }

  public reciveRoomInfoCallback(updates: UpdatedModels): void {
    // Needs to call TalkBehavior.receiveRoom (room) where room is the room received in the convo
  }

  public static moveBehaviorTransition(this: MoveBehavior): BehaviorState {
    if (MoveBehavior.destination === undefined) {
      return new IdleBehavior(MapAndMoveStrategy.idleBehaviorTransition);
    }
    if (KnowledgeBase.instance.isConversationRequested) {
      return new TalkBehavior(MapAndMoveStrategy.talkBehaviorTransition);
    } else if (this.currentActionState === SuccessAction.instance) {
      return new IdleBehavior(MapAndMoveStrategy.idleBehaviorTransition);
    }
    return this;
  }

  public static talkBehaviorTransition(this: TalkBehavior): BehaviorState {
    if (this.currentActionState === FailureAction.instance) {
      return new IdleBehavior(MapAndMoveStrategy.idleBehaviorTransition);
    } else if (this.currentActionState === SuccessAction.instance) {
      if (KnowledgeBase.instance.roomMap.findDisconnectedGraphs.length > 1) {
        return new MapBehavior(MapAndMoveStrategy.mapBehaviorTransition);
      } else {
        return new MoveBehavior(MapAndMoveStrategy.moveBehaviorTransition);
      }
    }
    return this;
  }

  public static idleBehaviorTransition(this: IdleBehavior): BehaviorState {
    if (KnowledgeBase.instance.isConversationRequested) {
      return new TalkBehavior(MapAndMoveStrategy.talkBehaviorTransition);
    }
    return this;
  }

  public static mapBehaviorTransition(this: MapBehavior): BehaviorState {
    if (KnowledgeBase.instance.isConversationRequested) {
      return new TalkBehavior(MapAndMoveStrategy.talkBehaviorTransition);
    } else if (this.currentActionState === SuccessAction.instance) {
      return new IdleBehavior(MapAndMoveStrategy.idleBehaviorTransition);
    }
    return this;
  }
}
