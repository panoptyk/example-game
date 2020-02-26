import {
  ActionState,
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior
} from "../../lib";
import { ClientAPI, Info, Quest } from "panoptyk-engine/dist/";
import * as Helper from "../helper";
import {
  LeaveConersationState,
  RequestConversationState,
  CompleteQuestState
} from "../";

export class TurnInBehavior extends BehaviorState {
  quest: Quest;
  solution: Info;

  private static _activeInstance: TurnInBehavior;
  public static get activeInstance(): TurnInBehavior {
    return TurnInBehavior._activeInstance;
  }
  constructor(quest: Quest, nextState?: () => BehaviorState) {
    super(nextState);
    this.quest = quest;
    for (const info of ClientAPI.playerAgent.getInfoByAction(
      this.quest.task.action
    )) {
      if (this.quest.checkSatisfiability(info)) {
        this.solution = info;
        break;
      }
    }

    if (!this.solution) {
      this.currentActionState = FailureAction.instance;
    } else if (ClientAPI.playerAgent.conversation) {
      if (ClientAPI.playerAgent.conversation.contains_agent(this.quest.giver)) {
        this.currentActionState = new CompleteQuestState(
          this.quest,
          this.solution
        );
      } else {
        this.currentActionState = new LeaveConersationState(
          TurnInBehavior.leaveTransition
        );
      }
    } else {
      this.currentActionState = new RequestConversationState(
        this.quest.giver,
        TurnInBehavior.requestConversationTransition
      );
    }
  }

  public async act() {
    TurnInBehavior._activeInstance = this;
    this.currentActionState = await this.currentActionState.tick();
  }

  static leaveTransition(this: LeaveConersationState): ActionState {
    if (this.completed) {
      return new RequestConversationState(
        TurnInBehavior.activeInstance.quest.giver,
        TurnInBehavior.requestConversationTransition
      );
    }
    return this;
  }

  static requestConversationTransition(
    this: RequestConversationState
  ): ActionState {
    if (ClientAPI.playerAgent.conversation) {
      return new CompleteQuestState(
        TurnInBehavior.activeInstance.quest,
        TurnInBehavior.activeInstance.solution
      );
    }
    return this;
  }

  public nextState(): BehaviorState {
    return this;
  }
}
