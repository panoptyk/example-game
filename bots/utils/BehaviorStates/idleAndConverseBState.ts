import {
  ActionState,
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior
} from "../../lib";
import { ClientAPI, Agent, Info } from "panoptyk-engine/dist/";
import * as Helper from "../helper";
import {
  LeaveConersationState,
  ListenToOther,
  IdleState,
  AcceptConersationState
} from "../";

export class IdleAndConverseBehavior extends BehaviorState {
  private static _activeInstance: IdleAndConverseBehavior;
  static get activeInstance(): IdleAndConverseBehavior {
    return IdleAndConverseBehavior._activeInstance;
  }

  constructor(nextState?: () => BehaviorState) {
    super(nextState);
    if (ClientAPI.playerAgent.conversation) {
      this.currentActionState = new ListenToOther(
        Helper.WAIT_FOR_OTHER,
        IdleAndConverseBehavior.listenTransition
      );
    } else {
      this.currentActionState = new IdleState(
        IdleAndConverseBehavior.idleTransition
      );
    }
  }

  public async act() {
    IdleAndConverseBehavior._activeInstance = this;
    this.currentActionState = await this.currentActionState.tick();
  }

  static idleTransition(this: IdleState): ActionState {
    if (ClientAPI.playerAgent.conversationRequesters[0]) {
      return new AcceptConersationState(
        ClientAPI.playerAgent.conversationRequesters[0],
        IdleAndConverseBehavior.acceptConvTransition
      );
    }
    return this;
  }

  static acceptConvTransition(this: AcceptConersationState) {
    if (this.completed) {
      return new ListenToOther(
        Helper.WAIT_FOR_OTHER,
        IdleAndConverseBehavior.listenTransition
      );
    } else if (this.doneActing) {
      return new IdleState(IdleAndConverseBehavior.idleTransition);
    }
    return this;
  }

  static leaveTransition(this: LeaveConersationState): ActionState {
    if (this.completed) {
      return new IdleState(IdleAndConverseBehavior.idleTransition);
    }
    return this;
  }

  static listenTransition(this: ListenToOther) {
    if (Date.now() - this.lastUpdate > this.timeout) {
      return new LeaveConersationState(IdleAndConverseBehavior.leaveTransition);
    }
    return this;
  }

  public nextState() {
    return this;
  }
}
