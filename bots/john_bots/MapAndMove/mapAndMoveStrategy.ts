import {
  Strategy,
  KnowledgeBase,
  BehaviorState,
  SuccessAction,
  FailureAction
} from "../../lib";
import { MoveBehavior } from "./Behaviors/moveBehavior";
import { TalkBehavior } from "./Behaviors/talkBehavior";
import { IdleBehavior } from "./Behaviors/idleBehavior";
import { MapBehavior } from "./Behaviors/mapBehavior";

export class MapAndMoveStrategy extends Strategy {
  constructor() {
    super();
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
        MoveBehavior.assignNewDestinationRoom (TalkBehavior.useRoom ());
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
