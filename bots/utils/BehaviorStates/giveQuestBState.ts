import {
  ActionState,
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior
} from "../../lib";
import { ClientAPI, Agent, Room, Info } from "panoptyk-engine/dist/";
import * as Helper from "../helper";
import {
  LeaveConersationState,
  RequestConversationState,
  TellInfoState,
  GiveQuestState
} from "../";

export class GiveQuestBehavior extends BehaviorState {
  _targetAgent: Agent;
  _task: object;
  _isQuestion: boolean;
  _toTell: Info[];
  _hasAssigned = false;
  private static _activeInstance: GiveQuestBehavior;
  public static get activeInstance(): GiveQuestBehavior {
    return this._activeInstance;
  }

  constructor(
    targetAgent: Agent,
    task: object,
    isQuestion: boolean,
    relatedInfo: Info[] = [],
    nextState?: () => BehaviorState
  ) {
    super(nextState);
    this._targetAgent = targetAgent;
    this._task = task;
    this._isQuestion = isQuestion;
    this._toTell = relatedInfo;

    if (ClientAPI.playerAgent.conversation) {
      if (Helper.getOthersInConversation[0] === this._targetAgent) {
        if (this._toTell[0]) {
          this.currentActionState = new TellInfoState(
            this._toTell.pop(),
            [],
            GiveQuestBehavior.tellTransition
          );
        } else {
          this.currentActionState = new GiveQuestState(
            this._targetAgent,
            this._task,
            this._isQuestion
          );
        }
      } else {
        this.currentActionState = new LeaveConersationState(
          GiveQuestBehavior.leaveTransition
        );
      }
    } else {
      this.currentActionState = new RequestConversationState(
        this._targetAgent,
        GiveQuestBehavior.requestConversationTransition
      );
    }
  }

  public async act() {
    GiveQuestBehavior._activeInstance = this;
    this.currentActionState = await this.currentActionState.tick();
  }

  static requestConversationTransition(
    this: RequestConversationState
  ): ActionState {
    if (ClientAPI.playerAgent.conversation) {
      if (GiveQuestBehavior.activeInstance._toTell[0]) {
        return new TellInfoState(
          GiveQuestBehavior.activeInstance._toTell.pop(),
          [],
          GiveQuestBehavior.tellTransition
        );
      } else {
        return new GiveQuestState(
          GiveQuestBehavior._activeInstance._targetAgent,
          GiveQuestBehavior._activeInstance._task,
          GiveQuestBehavior._activeInstance._isQuestion
        );
      }
    }
    else if (
      (!this.completed && this.doneActing) ||
      this.deltaTime > Helper.WAIT_FOR_OTHER ||
      !ClientAPI.playerAgent.room.hasAgent(this.targetAgent)
    ) {
      return FailureAction.instance;
    }
    return this;
  }

  static tellTransition(this: TellInfoState): ActionState {
    if (this.completed) {
      if (GiveQuestBehavior.activeInstance._toTell[0]) {
        return new TellInfoState(
          GiveQuestBehavior.activeInstance._toTell.pop(),
          [],
          GiveQuestBehavior.tellTransition
        );
      } else {
        return new GiveQuestState(
          GiveQuestBehavior._activeInstance._targetAgent,
          GiveQuestBehavior._activeInstance._task,
          GiveQuestBehavior._activeInstance._isQuestion
        );
      }
    } else if (this.doneActing) {
      return FailureAction.instance;
    }
    return this;
  }

  static leaveTransition(this: LeaveConersationState): ActionState {
    if (this.completed) {
      return new RequestConversationState(
        GiveQuestBehavior.activeInstance._targetAgent,
        GiveQuestBehavior.requestConversationTransition
      );
    }
    return this;
  }

  public nextState() {
    return this;
  }
}
