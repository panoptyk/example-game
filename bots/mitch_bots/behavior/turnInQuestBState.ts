import { BehaviorState, SuccessAction, ActionState, FailureAction } from "../../lib";
import * as KB from "../kb/KBadditions";
import { LeaveConvoAction } from "../action/leaveConvoAState";
import { EnterConvoAction } from "../action/enterConvoAState";
import { GetQuestBehavior } from "./getQuestBState";
import { Quest } from "panoptyk-engine/dist/client";
import { TurnInQuestAction } from "../action/turnInQuestItemsAState";
import { IdleBehavior } from "./idleBState";


export class TurnInQuestBehavior extends BehaviorState {
  _quests: Quest[];

  constructor(nextState?: () => BehaviorState) {
    super(nextState);
    this._fail = !KB.is.factionLeaderInRoom();
    this._quests = KB.get.completableQuests();
    if (!this._complete) {
      this.currentActionState = new LeaveConvoAction(
        KB.agent.factionLeader,
        3000,
        TurnInQuestBehavior.createLeaveConvoTransition(this)
      );
    } else {
      this.currentActionState = SuccessAction.instance;
    }
  }

  async act() {
    await super.act();
    this._fail = this.currentActionState === FailureAction.instance;
    this._success = this.currentActionState === SuccessAction.instance;
  }

  nextState(): BehaviorState {
    if (this._success) {
      return new GetQuestBehavior();
    } else if (this._fail) {
      return IdleBehavior.instance;
    }
    return this;
  }

  static createLeaveConvoTransition(
    state: TurnInQuestBehavior
  ): (this: LeaveConvoAction) => ActionState {
    return function(this: LeaveConvoAction) {
      if (this._fail) {
        return FailureAction.instance;
      } else if (this._success) {
        return new EnterConvoAction(
          KB.agent.factionLeader,
          5000,
          TurnInQuestBehavior.createEnterConvoTransition(state)
        );
      }
      return this;
    };
  }

  static createEnterConvoTransition(
    state: TurnInQuestBehavior
  ): (this: EnterConvoAction) => ActionState {
    return function(this: EnterConvoAction) {
      const quest = state._quests[0];
      if (this._success && quest) {
        state._quests.shift();
        return new TurnInQuestAction(quest, 3000, TurnInQuestBehavior.createTurnInQuestTransition(state));
      } else if (this._success) {
        return SuccessAction.instance;
      } else if (this._fail) {
        return FailureAction.instance;
      }
      return this;
    };
  }

  static createTurnInQuestTransition(
    state: TurnInQuestBehavior
  ): (this: TurnInQuestAction) => ActionState {
    return function(this: TurnInQuestAction) {
      const quest = state._quests[0];
      if (this._complete && quest) {
        state._quests.shift();
        return new TurnInQuestAction(quest, 3000, TurnInQuestBehavior.createTurnInQuestTransition(state));
      } else if (this._success) {
        return SuccessAction.instance;
      } else if (this._fail) {
        return FailureAction.instance;
      }
      return this;
    };
  }
}