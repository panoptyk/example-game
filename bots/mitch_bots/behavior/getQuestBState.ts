import {
  BehaviorState,
  SuccessAction,
  SuccessBehavior,
  FailureBehavior,
  FailureAction,
  ActionState
} from "../../lib";
import * as KB from "../kb/KBadditions";
import { LeaveConvoAction } from "../action/leaveConvoAState";
import { EnterConvoAction } from "../action/enterConvoAState";
import { IdleBehavior } from "./idleBState";

export class GetQuestBehavior extends BehaviorState {
  _timeOut = 6000;

  constructor(nextState?: () => BehaviorState) {
    super(nextState);
    this._success = !KB.is.newQuestAvailable();
    this._fail = !KB.is.factionLeaderInRoom();
    if (!this._complete) {
      this.currentActionState = new LeaveConvoAction(
        KB.agent.factionLeader,
        3000,
        GetQuestBehavior.createLeaveConvoTransition(this)
      );
    } else {
      this.currentActionState = SuccessAction.instance;
    }
  }

  async act() {
    await super.act();
    this._success = !KB.is.newQuestAvailable();
    this._fail =
      this.currentActionState === FailureAction.instance ||
      Date.now() - this.startTime > this._timeOut;
  }

  nextState(): BehaviorState {
    if (this._complete) {
      return IdleBehavior.instance;
    } else {
      return this;
    }
  }

  static createLeaveConvoTransition(
    state: GetQuestBehavior
  ): (this: LeaveConvoAction) => ActionState {
    return function(this: LeaveConvoAction) {
      if (this._fail) {
        return FailureAction.instance;
      } else if (this._success) {
        return new EnterConvoAction(
          KB.agent.factionLeader,
          5000,
          GetQuestBehavior.createEnterConvoTransition(state)
        );
      }
      return this;
    };
  }

  static createEnterConvoTransition(
    state: GetQuestBehavior
  ): (this: EnterConvoAction) => ActionState {
    return function(this: EnterConvoAction) {
      if (this._fail) {
        return FailureAction.instance;
      } else if (this._success) {
        return SuccessAction.instance;
      }
      return this;
    };
  }
}
