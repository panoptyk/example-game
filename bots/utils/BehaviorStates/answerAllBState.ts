import {
  ActionState,
  BehaviorState,
  SuccessAction,
  FailureAction
} from "../../lib";
import { ClientAPI, Agent, Info } from "panoptyk-engine/dist/";
import * as Helper from "../helper";
import {
  LeaveConersationState,
  TellInfoState,
  RequestConversationState,
  IdleState,
  PassQuestionState
} from "../";

export class AnswerAllBehavior extends BehaviorState {
  private _answeredQuestions: Set<Info> = new Set<Info>();
  public get answeredQuestions(): Set<Info> {
    return this._answeredQuestions;
  }
  toTell: Info[] = [];

  private static _instance: AnswerAllBehavior;
  public static get instance(): AnswerAllBehavior {
    if (!this._instance) {
      this._instance = new AnswerAllBehavior();
    }
    return AnswerAllBehavior._instance;
  }

  getNextAction(): ActionState {
    const conversation = ClientAPI.playerAgent.conversation;
    if (conversation) {
      for (const question of conversation.askedQuestions) {
        if (!this._answeredQuestions.has(question)) {
          this._answeredQuestions.add(question);
          this.toTell = Helper.getAllRelatedInfo(question);
          if (this.toTell[0]) {
            return new TellInfoState(
              this.toTell.pop(),
              [],
              AnswerAllBehavior.tellTransition
            );
          } else {
            return new PassQuestionState(question, this.getNextAction);
          }
        }
      }
      return new IdleState(this.getNextAction);
    } else {
      return SuccessAction.instance;
    }
  }

  public static start(nextState?: () => BehaviorState) {
    this._instance = new AnswerAllBehavior(nextState);
    this.instance.toTell = [];
    this.instance.currentActionState = this.instance.getNextAction();
    return this.instance;
  }

  public async act() {
    AnswerAllBehavior._instance = this;
    this.currentActionState = await this.currentActionState.tick();
  }

  public static tellTransition(this: TellInfoState) {
    if (this.completed) {
      if (AnswerAllBehavior.instance.toTell[0]) {
        return new TellInfoState(
          AnswerAllBehavior.instance.toTell.pop(),
          [],
          AnswerAllBehavior.tellTransition
        );
      } else {
        return AnswerAllBehavior.instance.getNextAction();
      }
    } else if (this.doneActing) {
      return FailureAction.instance;
    }
    return this;
  }

  public nextState(): BehaviorState {
    return this;
  }
}
