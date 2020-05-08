import { Strategy, BehaviorState, SuccessAction } from "../../../lib";
import { MapBehavior } from "../Behaviors/mapBehavior";
import { IdleBehavior } from "../Behaviors/idleBehavior";
import { MoveBehavior } from "../Behaviors/moveBehavior";
import { ClientAPI } from "panoptyk-engine/dist/client";

export class TraderLeaderStrategy extends Strategy {
  constructor() {
    super();
    this.currentBehavior = new MapBehavior(TraderLeaderStrategy.mapBehaviorTransition);
  }

  public static mapBehaviorTransition(this: MapBehavior): BehaviorState {
    if (this.currentActionState === SuccessAction.instance) {
      return new IdleBehavior(TraderLeaderStrategy.idleBehaviorTransition);
    }
    return this;
  }

  public static idleBehaviorTransition(this: IdleBehavior): BehaviorState {
    if (ClientAPI.playerAgent.conversationRequesters.length > 0) {
      
    }
    return this;
  }
}