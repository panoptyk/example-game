import {
  ClientAPI,
  Agent,
  Info,
  Quest,
  Item,
  Conversation
} from "panoptyk-engine/dist/";
import {
  Strategy,
  SuccessAction,
  FailureAction,
  BehaviorState,
  ActionState,
  FailureBehavior
} from "../../../../lib";
import {
  IdleState,
  TellInfo,
  TurnInBehavior,
  GiveQuestBehavior,
  TradeBehavior,
  IdleBehavior,
  IdleAndConverseBehavior,
  AnswerAllBehavior,
  SetTradeState,
  OfferItemTradeState,
  PassItemReqTradeState,
  QuestionQuestBehavior,
  NavigateToAgentBehavior
} from "../../../../utils";
import * as Helper from "../../../../utils/helper";
import { CrimePatrolBehavior } from "../BehaviorStates/crimePatrolBState";

/**
 * NOT FUNCTIONAL
 * being saved so it can eventually be broken into multiple strategies
 */
export class CrimeGoon extends Strategy {
  private _activeQuest: Quest;
  public get activeQuest(): Quest {
    return this._activeQuest;
  }
  private _questBehavior: BehaviorState;

  // item quest specific
  hasGivenItem = false;

  private static _instance: CrimeGoon;
  public static get instance(): CrimeGoon {
    if (!this._instance) {
      this._instance = new CrimeGoon();
    }
    return CrimeGoon._instance;
  }

  private constructor() {
    super();
    this.currentBehavior = new IdleAndConverseBehavior();
  }

  public async act() {
    this.currentBehavior = await this.currentBehavior.tick();
  }

  /**
   * Gets next quest prioritizing action quests
   */
  public static getNextValidQuest(): Quest {
    let patrolQuest: Quest;
    for (const quest of ClientAPI.playerAgent.activeAssignedQuests) {
      if (
        quest.giver.faction === ClientAPI.playerAgent.faction &&
        quest.giver.factionRank > ClientAPI.playerAgent.factionRank
      ) {
        if (quest.task.action) {
          return quest;
        } else {
          patrolQuest = quest;
        }
      }
    }
    return patrolQuest;
  }

  public static tradeRequestedItems(this: TradeBehavior): ActionState {
    const trade = ClientAPI.playerAgent.trade;
    if (trade) {
      const other = Helper.getOtherInTrade();
      for (const [desiredItem, passed] of trade.getAgentsRequestedItems(
        other
      )) {
        if (
          !trade.getAgentItemsData(ClientAPI.playerAgent).includes(desiredItem)
        ) {
          if (ClientAPI.playerAgent.hasItem(desiredItem)) {
            return new OfferItemTradeState(
              [desiredItem],
              this.getNextTradeAction
            );
          } else if (!passed) {
            return new PassItemReqTradeState(
              desiredItem,
              this.getNextTradeAction
            );
          }
        }
      }
      if (!trade.getAgentReadyStatus(ClientAPI.playerAgent)) {
        return new SetTradeState(true, this.getNextTradeAction);
      }
      return new IdleState(this.getNextTradeAction);
    }
    return SuccessAction.instance;
  }

  public static helpAllyInConversation(
    targetAgent: Agent,
    nextState: BehaviorState
  ): BehaviorState {
    for (const question of ClientAPI.playerAgent.conversation.askedQuestions) {
      if (!AnswerAllBehavior.instance.answeredQuestions.has(question)) {
        return AnswerAllBehavior.start(() => nextState);
      }
    }
    if (ClientAPI.playerAgent.tradeRequesters.includes(targetAgent)) {
      return new TradeBehavior(
        targetAgent,
        () => nextState,
        CrimeGoon.tradeRequestedItems
      );
    }
  }

  public static idleTransition(this: IdleAndConverseBehavior) {
    if (
      ClientAPI.playerAgent.conversation &&
      Helper.getOthersInConversation()[0].faction ===
        ClientAPI.playerAgent.faction
    ) {
      const helpBehavior = CrimeGoon.helpAllyInConversation(
        Helper.getOthersInConversation()[0],
        this
      );
      if (helpBehavior) {
        return helpBehavior;
      }
    }
    const newQuest = CrimeGoon.getNextValidQuest();
    if (newQuest) {
      CrimeGoon.instance._activeQuest = newQuest;
      if (newQuest.task.action) {
        if (newQuest.type === "question") {
          return QuestionQuestBehavior.start(
            newQuest,
            CrimeGoon.questionQuestTransition
          );
        } else if (newQuest.type === "command") {
          // assuming give item quest
          CrimeGoon.instance.hasGivenItem = false;
          return CrimeGoon.nextGiveItemQuestBehavior();
        }
      } else {
        return CrimePatrolBehavior.start(newQuest, CrimeGoon.patrolTransition);
      }
      console.log(ClientAPI.playerAgent + " unable to solve quest type!");
    }
    return this;
  }

  public static patrolTransition(this: CrimePatrolBehavior): BehaviorState {
    for (const agent of ClientAPI.playerAgent.conversationRequesters) {
      if (ClientAPI.playerAgent.faction === agent.faction) {
        CrimeGoon.instance._questBehavior = this;
        return new TellInfo(
          agent,
          [CrimeGoon.instance.activeQuest.info],
          CrimeGoon.tellQuestTransition
        );
      }
    }
    if (this.solutions.size >= 5) {
      if (!ClientAPI.playerAgent.room.hasAgent(this.patrolQuest.giver)) {
        return NavigateToAgentBehavior.start(
          this.patrolQuest.giver,
          CrimeGoon.turnInMoveTransition
        );
      } else {
        return new TurnInBehavior(this.patrolQuest, CrimeGoon.turnInTransition);
      }
    }
    return this;
  }

  public static questionQuestTransition(
    this: QuestionQuestBehavior
  ): BehaviorState {
    for (const agent of ClientAPI.playerAgent.conversationRequesters) {
      if (ClientAPI.playerAgent.faction === agent.faction) {
        CrimeGoon.instance._questBehavior = this;
        return new TellInfo(
          agent,
          [CrimeGoon.instance.activeQuest.info],
          CrimeGoon.tellQuestTransition
        );
      }
    }
    if (this.currentActionState instanceof SuccessAction) {
      if (!ClientAPI.playerAgent.room.hasAgent(this.quest.giver)) {
        return NavigateToAgentBehavior.start(
          this.quest.giver,
          CrimeGoon.turnInMoveTransition
        );
      } else {
        return new TurnInBehavior(this.quest, CrimeGoon.turnInTransition);
      }
    }
  }

  public static giveQuestItem(this: TradeBehavior): ActionState {
    const trade = ClientAPI.playerAgent.trade;
    const targetItem = CrimeGoon.instance.activeQuest.task.getTerms().item;
    if (trade) {
      if (!trade.agentOfferedItem(ClientAPI.playerAgent, targetItem)) {
        return new OfferItemTradeState([targetItem], this.getNextTradeAction);
      }
      if (!trade.getAgentReadyStatus(ClientAPI.playerAgent)) {
        return new SetTradeState(true, this.getNextTradeAction);
      }
      return new IdleState(this.getNextTradeAction);
    }
    CrimeGoon.instance.hasGivenItem = true;
    return SuccessAction.instance;
  }

  /**
   * this should probably exist as its own strategy
   */
  public static nextGiveItemQuestBehavior(): BehaviorState {
    const terms = this.instance.activeQuest.task.getTerms();
    if (!CrimeGoon.instance.hasGivenItem) {
      if (ClientAPI.playerAgent.hasItem(terms.item)) {
        if (ClientAPI.playerAgent.room.hasAgent(terms.agent2)) {
          return new TradeBehavior(
            terms.agent2,
            CrimeGoon.nextGiveItemQuestBehavior,
            CrimeGoon.giveQuestItem
          );
        }
      }
    } else if (
      !ClientAPI.playerAgent.room.hasAgent(CrimeGoon.instance.activeQuest.giver)
    ) {
      return NavigateToAgentBehavior.start(
        CrimeGoon.instance.activeQuest.giver,
        CrimeGoon.turnInMoveTransition
      );
    } else {
      return new TurnInBehavior(
        CrimeGoon.instance.activeQuest,
        CrimeGoon.turnInTransition
      );
    }
  }

  public static turnInMoveTransition(
    this: NavigateToAgentBehavior
  ): BehaviorState {
    if (this.currentActionState instanceof SuccessAction) {
      return new TurnInBehavior(
        CrimeGoon.instance.activeQuest,
        CrimeGoon.turnInTransition
      );
    }
  }

  public static turnInTransition(this: TurnInBehavior): BehaviorState {
    if (this.currentActionState instanceof SuccessAction) {
      return new IdleAndConverseBehavior(CrimeGoon.idleTransition);
    }
    if (this.currentActionState instanceof FailureAction) {
      if (
        !ClientAPI.playerAgent.room.hasAgent(
          TurnInBehavior.activeInstance.quest.giver
        )
      ) {
        return NavigateToAgentBehavior.start(
          this.quest.giver,
          CrimeGoon.turnInMoveTransition
        );
      }
      console.log(ClientAPI.playerAgent + ": QUEST TURN-IN CRITICAL FAILURE!");
    }
    return this;
  }

  public static tellQuestTransition(this: TellInfo): BehaviorState {
    if (this.currentActionState instanceof SuccessAction) {
      const helpBehavior = CrimeGoon.helpAllyInConversation(
        Helper.getOthersInConversation()[0],
        this
      );
      if (helpBehavior) {
        return helpBehavior;
      }
    } else if (
      this.currentActionState instanceof FailureAction ||
      this.deltaTime > Helper.WAIT_FOR_OTHER
    ) {
      return CrimeGoon.instance._questBehavior;
    }
    return this;
  }
}
