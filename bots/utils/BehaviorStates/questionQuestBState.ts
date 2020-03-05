import {
  ActionState,
  BehaviorState,
  SuccessAction,
  FailureAction
} from "../../lib";
import { ClientAPI, Info, Quest, Agent } from "panoptyk-engine/dist/";
import * as Helper from "../helper";
import {
  LeaveConersationState,
  RequestConversationState,
  TurnInQuestInfoState,
  AskQuestionState,
  ListenToOther,
  MoveState
} from "..";

export class QuestionQuestBehavior extends BehaviorState {
  private _quest: Quest;
  public get quest(): Quest {
    return this._quest;
  }
  private _solution: Info;
  public get solution(): Info {
    return this._solution;
  }

  currentTarget: Agent;
  askedAgents: Map<Agent, number> = new Map<Agent, number>();
  exploredInfo: Set<Info> = new Set<Info>();

  private static _instance: QuestionQuestBehavior;
  public static get instance(): QuestionQuestBehavior {
    if (!this._instance) {
      this._instance = new QuestionQuestBehavior();
    }
    return QuestionQuestBehavior._instance;
  }

  public static start(quest: Quest, nextState?: () => BehaviorState) {
    if (this.instance._quest !== quest) {
      this._instance = new QuestionQuestBehavior();
      this.instance._quest = quest;
    }
    if (nextState) {
      this._instance.nextState = nextState;
    }
    this.instance.currentActionState = this.instance.getNextAction();
    return this.instance;
  }

  /**
   * Returns true if given agent has been asked in the last 60 seconds
   * @param agent
   */
  private hasRecentlyAsked(agent: Agent) {
    if (this.askedAgents.has(agent) && this.askedAgents.get(agent) < 60000) {
      return true;
    }
    return false;
  }

  private getSolution() {
    for (const info of ClientAPI.playerAgent.knowledge) {
      if (
        !this._quest.hasTurnedIn(info) &&
        this._quest.checkSatisfiability(info)
      ) {
        return info;
      }
    }
    return undefined;
  }

  private findLead() {
    for (const told of ClientAPI.playerAgent.getInfoByAction("TOLD")) {
      this.exploredInfo.add(told);
      const terms = told.getTerms();
      const toldInfo: Info = terms.info; // The contents of the information that was told
      if (
        !this.exploredInfo.has(told) &&
        !this.hasRecentlyAsked(terms.agent1) &&
        !(
          terms.agent1 === ClientAPI.playerAgent ||
          terms.agent2 === ClientAPI.playerAgent
        ) &&
        toldInfo.isAnswer(this._quest.task) &&
        !this._quest.hasTurnedIn(toldInfo)
      ) {
        return terms.agent1;
      }
    }
    // pick a random agent that we haven't asked if we have no leads
    for (const agent of Helper.getOthersInRoom()) {
      if (!this.hasRecentlyAsked(agent)) {
        return agent;
      }
    }
  }

  private getNextMove() {
    // TODO: add better logic here later
    const neighbors = ClientAPI.playerAgent.room.getAdjacentRooms();
    return new MoveState(
      neighbors[Helper.randomInt(0, neighbors.length)],
      () => this.getNextAction()
    );
  }

  private getNextAction(): ActionState {
    this._solution = this.getSolution();
    if (this._solution) {
      return SuccessAction.instance;
    }
    if (
      ClientAPI.playerAgent.conversation &&
      !this.hasRecentlyAsked(Helper.getOthersInConversation()[0])
    ) {
      return new AskQuestionState(
        this._quest.task.getTerms(),
        [],
        QuestionQuestBehavior.askTransition
      );
    }
    if (!this.currentTarget) {
      this.currentTarget = this.findLead();
    }
    if (ClientAPI.playerAgent.room.hasAgent(this.currentTarget)) {
      return new RequestConversationState(
        this.currentTarget,
        QuestionQuestBehavior.requestConvTransition
      );
    } else {
      return this.getNextMove();
    }
  }

  public static requestConvTransition(
    this: RequestConversationState
  ): ActionState {
    if (ClientAPI.playerAgent.conversation) {
      return new AskQuestionState(
        QuestionQuestBehavior.instance._quest.task.getTerms(),
        [],
        QuestionQuestBehavior.askTransition
      );
    } else if (
      this.deltaTime > Helper.WAIT_FOR_OTHER ||
      !ClientAPI.playerAgent.room.hasAgent(this.targetAgent)
    ) {
      return QuestionQuestBehavior.instance.getNextAction();
    }
    return this;
  }

  public static askTransition(this: AskQuestionState) {
    if (this.completed) {
      QuestionQuestBehavior.instance.askedAgents.set(
        Helper.getOthersInConversation()[0],
        Date.now()
      );
      return new ListenToOther(
        Helper.WAIT_FOR_OTHER,
        QuestionQuestBehavior.instance.getNextAction
      );
    }
    if (this.doneActing) {
      return QuestionQuestBehavior.instance.getNextAction();
    }
    return this;
  }

  public async act() {
    this.currentActionState = await this.currentActionState.tick();
  }

  public nextState(): BehaviorState {
    return this;
  }
}
