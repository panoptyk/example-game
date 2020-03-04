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
  TurnInQuestInfoState
} from "../";

export class TurnInBehavior extends BehaviorState {
  quest: Quest;
  solutions: Info[] = [];

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
        this.solutions.push(info);
      }
    }

    if (
      !this.solutions[0] ||
      !ClientAPI.playerAgent.room.hasAgent(this.quest.giver)
    ) {
      this.currentActionState = FailureAction.instance;
    } else if (ClientAPI.playerAgent.conversation) {
      if (ClientAPI.playerAgent.conversation.contains_agent(this.quest.giver)) {
        this.currentActionState = new TurnInQuestInfoState(
          this.quest,
          this.solutions.pop(),
          TurnInBehavior.turnInTransition
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
      return new TurnInQuestInfoState(
        TurnInBehavior.activeInstance.quest,
        TurnInBehavior.activeInstance.solutions.pop(),
        TurnInBehavior.turnInTransition
      );
    } else if (!ClientAPI.playerAgent.room.hasAgent(this.targetAgent)) {
      return FailureAction.instance;
    }
    return this;
  }

  static turnInTransition(this: TurnInQuestInfoState): ActionState {
    if (this.completed) {
      if (TurnInBehavior.activeInstance.solutions[0]) {
        return new TurnInQuestInfoState(
          TurnInBehavior.activeInstance.quest,
          TurnInBehavior.activeInstance.solutions.pop(),
          TurnInBehavior.turnInTransition
        );
      }
      return SuccessAction.instance;
    } else if (this.doneActing) return FailureAction.instance;
    else return this;
  }

  public nextState(): BehaviorState {
    return this;
  }
}
