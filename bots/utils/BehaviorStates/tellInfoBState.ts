import {
  ActionState,
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior,
} from "../../lib";
import { ClientAPI, Agent, Info } from "panoptyk-engine/dist/";
import * as Helper from "../helper";
import {
  LeaveConersationState,
  TellInfoState,
  RequestConversationState,
} from "../";

export class TellInfo extends BehaviorState {
  _targetAgent: Agent;
  _toTell: Info[];
  _leaveAfter: boolean;

  private static _activeInstance: TellInfo;
  static get activeInstance(): TellInfo {
    return TellInfo._activeInstance;
  }

  constructor(
    targetAgent: Agent,
    toTell: Info[],
    leaveAfter = false,
    nextState?: () => BehaviorState
  ) {
    super(nextState);
    this._targetAgent = targetAgent;
    this._toTell = toTell;
    this._leaveAfter = leaveAfter;
    this.currentActionState = this.getNextAction();
  }

  public getNextAction() {
    if (this._toTell.length === 0) {
      if (this._leaveAfter && ClientAPI.playerAgent.conversation) {
        return new LeaveConersationState(TellInfo.leaveTransition);
      }
      return SuccessAction.instance;
    } else if (ClientAPI.playerAgent.conversation) {
      if (
        ClientAPI.playerAgent.conversation.contains_agent(this._targetAgent)
      ) {
        return new TellInfoState(
          this._toTell.pop(),
          [],
          TellInfo.tellTransition
        );
      } else {
        return new LeaveConersationState(TellInfo.leaveTransition);
      }
    } else {
      return new RequestConversationState(
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
      return TellInfo.activeInstance.getNextAction();
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
    if (this.completed || this.doneActing) {
      return TellInfo.activeInstance.getNextAction();
    }
    return this;
  }

  public nextState() {
    return this;
  }
}
