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
  TellInfoState,
  RequestConversationState
} from "../";

export class TellInfo extends BehaviorState {
  _targetAgent: Agent;
  _toTell: Info[];

  private static _activeInstance: TellInfo;
  static get activeInstance(): TellInfo {
    return TellInfo._activeInstance;
  }

  constructor(
    targetAgent: Agent,
    toTell: Info[],
    nextState?: () => BehaviorState
  ) {
    super(nextState);
    this._targetAgent = targetAgent;
    this._toTell = toTell;
    if (ClientAPI.playerAgent.conversation) {
      if (ClientAPI.playerAgent.conversation.contains_agent(this._targetAgent)) {
        this.currentActionState = new TellInfoState(
          this._toTell.pop(),
          [],
          TellInfo.tellTransition
        );
      } else {
        this.currentActionState = new LeaveConersationState(
          TellInfo.leaveTransition
        );
      }
    } else {
      this.currentActionState = new RequestConversationState(
        this._targetAgent,
        TellInfo.requestConversationTransition
      );
    }
  }

  public async act() {
    TellInfo._activeInstance = this;
    this.currentActionState = await this.currentActionState.tick();
  }

  static leaveTransition(this: LeaveConersationState): ActionState {
    if (this.completed) {
      return new RequestConversationState(
        TellInfo.activeInstance._targetAgent,
        TellInfo.requestConversationTransition
      );
    }
    return this;
  }

  static requestConversationTransition(
    this: RequestConversationState
  ): ActionState {
    if (ClientAPI.playerAgent.conversation) {
      return new TellInfoState(
        TellInfo.activeInstance._toTell.pop(),
        [],
        TellInfo.tellTransition
      );
    }
    else if (
      (!this.completed && this.doneActing) ||
      Date.now() - this.startTime > Helper.WAIT_FOR_OTHER ||
      !ClientAPI.playerAgent.room.hasAgent(this.targetAgent)
    ) {
      return FailureAction.instance;
    }
    return this;
  }

  static tellTransition(this: TellInfoState): ActionState {
    if (this.completed) {
      if (TellInfo.activeInstance._toTell[0]) {
        return new TellInfoState(
          TellInfo.activeInstance._toTell.pop(),
          [],
          TellInfo.tellTransition
        );
      } else {
        return SuccessAction.instance;
      }
    } else if (this.doneActing) {
      return FailureAction.instance;
    }
    return this;
  }

  public nextState() {
    return this;
  }
}
