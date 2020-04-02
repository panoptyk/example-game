import {
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior,
  ActionState
} from "../../lib";
import { log } from "../util/log";
import * as KB from "../kb/KBadditions";
import DECIDES from "../util/decision";
import { LeaveConvoAction } from "../action/leaveConvoAState";
import { EnterConvoAction } from "../action/enterConvoAState";
import { Agent } from "panoptyk-engine/dist/client";
import { TradeBehavior } from "./tradeBState";
import { TellInfoAction } from "../action/tellInfoAState";
import { AskQuestionAction } from "../action/askQuestionAState";
import { RequestTradeAction } from "../action/requestTradeAState";

export class DiscussBehavior extends BehaviorState {
  static createLeaveConvoTransition(
    state: DiscussBehavior
  ): (this: LeaveConvoAction) => ActionState {
    return function(this: LeaveConvoAction) {
      if (this._fail) {
        return FailureAction.instance;
      } else if (this._success) {
        return new EnterConvoAction(
          state._target,
          20000,
          DiscussBehavior.createEnterConvoTransition(state)
        );
      }
      return this;
    };
  }

  static createEnterConvoTransition(
    state: DiscussBehavior
  ): (this: EnterConvoAction) => ActionState {
    return function(this: EnterConvoAction) {
      if (this._success) {
        log("Conversing with " + state._target, log.ACT);
        state._enteredConvo = true;
        return SuccessAction.instance;
      } else if (this._fail) {
        return FailureAction.instance;
      }
      return this;
    };
  }

  _target: Agent;

  _enteredConvo = false;
  _startTrade = false;
  _timedOut = false;

  _tradeWait = 3000;
  _tradeTime = 0;

  _lastAction: ActionState = undefined;
  _timeout = 55000;
  _lastActionTime = Date.now();

  _questionsAnswered = new Set<number>();
  _questionsAsked = 0;
  _askLimit = 1;

  constructor(target: Agent, nextState?: () => BehaviorState) {
    super(nextState);
    this._target = target;
    this._fail = !this._target;
    if (this._complete) {
      this.currentActionState = FailureAction.instance;
    } else {
      this.currentActionState = new LeaveConvoAction(
        this._target,
        5000,
        DiscussBehavior.createLeaveConvoTransition(this)
      );
    }
  }

  async act() {
    await super.act();
    this.checkTimout();
    this._fail =
      this.currentActionState === FailureAction.instance ||
      (this._enteredConvo && !KB.get.otherAgentInConvo()); // left convo
    this._startTrade = this._startTrade
      ? this._startTrade
      : this.shouldEnterTrade();
    if (this._startTrade) {
      this.currentActionState = new RequestTradeAction(this._target);
      this._startTrade = false;
    }
    if (
      !this._fail &&
      !this._startTrade &&
      this._enteredConvo &&
      this.currentActionState === SuccessAction.instance
    ) {
      this.decideNextConvoAction();
    }
  }

  shouldEnterTrade(): boolean {
    const now = Date.now();
    if (KB.get.player.trade !== undefined || KB.get.player.tradeRequested.indexOf(this._target) !== -1) {
      this._tradeTime = now;
      return false;
    }
    if (KB.get.player.tradeRequesters.indexOf(this._target) !== -1) {
      return DECIDES.decide("accept-trade");
    } else if (now - this._tradeTime > this._tradeWait) {
      this._tradeTime = now;
      return DECIDES.decide("decide-trade-random");
    }
    return false;
  }

  checkTimout() {
    if (this._lastAction !== this.currentActionState) {
      this._lastActionTime = Date.now();
    }
    this._lastAction = this.currentActionState;
    this._timedOut = Date.now() - this._lastActionTime > this._timeout;
  }

  decideNextConvoAction() {
    // Answer a question (tell info)
    for (const q of KB.get.questionsAskedByOtherInConvo()) {
      if (!this._questionsAnswered.has(q.id)) {
        this._questionsAnswered.add(q.id);
        if (DECIDES.decide("answer-question")) {
          const answer = KB.get.answerToQuestion(q);
          this.currentActionState = new TellInfoAction(answer);
          return;
        }
      }
    }

    // ask question
    if (
      this._questionsAsked < this._askLimit &&
      DECIDES.decide("ask-question")
    ) {
      this._questionsAsked++;
      const question = KB.get.questionToAsk();
      if (question) {
        this.currentActionState = new AskQuestionAction(question);
      }
    }
  }

  nextState(): BehaviorState {
    if (this._fail || this._timedOut) {
      return FailureBehavior.instance;
    } else if (this._enteredConvo && KB.get.player.trade !== undefined) {
      return new TradeBehavior(this._target);
    } else {
      return this;
    }
  }
}
