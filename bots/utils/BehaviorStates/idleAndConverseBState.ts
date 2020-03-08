import { ActionState, BehaviorState } from "../../lib";
import { ClientAPI, Agent, Info } from "panoptyk-engine/dist/";
import * as Helper from "../helper";
import {
  LeaveConersationState,
  ListenToOther,
  IdleState,
  AcceptConersationState,
  RequestConversationState
} from "../";

export class IdleAndConverseBehavior extends BehaviorState {
  agentsToRequest: Agent[] = [];

  private static _activeInstance: IdleAndConverseBehavior;
  static get activeInstance(): IdleAndConverseBehavior {
    return IdleAndConverseBehavior._activeInstance;
  }

  public wantsToConverseWith(targetAgent: Agent) {
    return true;
  }

  constructor(
    nextState?: () => BehaviorState,
    converseRequirement?: (agent: Agent) => boolean
  ) {
    super(nextState);
    if (converseRequirement) {
      this.wantsToConverseWith = converseRequirement;
    }
    this.currentActionState = this.getNextAction();
  }

  public async act() {
    IdleAndConverseBehavior._activeInstance = this;
    this.currentActionState = await this.currentActionState.tick();
  }

  public getNextAction(): ActionState {
    if (ClientAPI.playerAgent.conversation) {
      return new ListenToOther(
        Helper.WAIT_FOR_OTHER,
        IdleAndConverseBehavior.listenTransition
      );
    }
    for (const agent of ClientAPI.playerAgent.conversationRequesters) {
      if (this.wantsToConverseWith(agent)) {
        return new AcceptConersationState(agent, () => this.getNextAction());
      }
    }
    if (this.agentsToRequest[0]) {
      return new RequestConversationState(this.agentsToRequest.pop(), () =>
        this.getNextAction()
      );
    }
    return new IdleState(() => this.getNextAction());
  }

  static listenTransition(this: ListenToOther) {
    if (ClientAPI.playerAgent.conversation) {
      if (Date.now() - this.lastUpdate > this.timeout) {
        return new LeaveConersationState(() =>
          IdleAndConverseBehavior.activeInstance.getNextAction()
        );
      }
    } else {
      return IdleAndConverseBehavior.activeInstance.getNextAction();
    }
    return this;
  }

  public nextState() {
    return this;
  }
}
