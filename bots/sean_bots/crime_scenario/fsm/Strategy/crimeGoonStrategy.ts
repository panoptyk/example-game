import {
  ClientAPI,
  Agent,
  Info,
  Quest,
  Item,
  Conversation,
  Room
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
  NavigateToAgentBehavior,
  RequestItemTradeState,
  WanderRandomlyBehavior,
  NavigateToRoomBehavior
} from "../../../../utils";
import * as Helper from "../../../../utils/helper";
import { CrimePatrolBehavior } from "../BehaviorStates/crimePatrolBState";
import { StealBehavior } from "../BehaviorStates/stealBState";
import { PickupItemBehavior } from "../BehaviorStates/pickupItemBState";

/**
 * Should eventually be broken into multiple strategies
 */
export class CrimeGoon extends Strategy {
  private _activeQuest: Quest;
  public get activeQuest(): Quest {
    return this._activeQuest;
  }

  private static _instance: CrimeGoon;
  public static get instance(): CrimeGoon {
    if (!this._instance) {
      this._instance = new CrimeGoon();
    }
    return CrimeGoon._instance;
  }

  private constructor() {
    super();
    this.currentBehavior = new IdleAndConverseBehavior(
      CrimeGoon.idleTransition
    );
  }

  public async act() {
    console.log(
      ClientAPI.playerAgent +
        " BState: " +
        this.currentBehavior.constructor.name +
        ", AState: " +
        this.currentBehavior.currentActionState.constructor.name
    );
    if (this._activeQuest && this._activeQuest.status !== "ACTIVE") {
      this.currentBehavior = new IdleAndConverseBehavior(
        CrimeGoon.idleTransition
      );
    }
    this.currentBehavior = await this.currentBehavior.tick();
  }

  // =============================== GENERIC ASSIST ALLY LOGIC ========================

  public static tradeRequestedItems(this: TradeBehavior): ActionState {
    const trade = ClientAPI.playerAgent.trade;
    if (trade && Date.now() - this.startTime <= Helper.WAIT_FOR_OTHER) {
      const other = Helper.getOtherInTrade();
      for (const [desiredItem, passed] of trade.getAgentsRequestedItems(
        other
      )) {
        if (
          !trade.getAgentItemsData(ClientAPI.playerAgent).includes(desiredItem)
        ) {
          if (ClientAPI.playerAgent.hasItem(desiredItem)) {
            return new OfferItemTradeState([desiredItem], () =>
              this.getNextTradeAction()
            );
          } else if (!passed) {
            return new PassItemReqTradeState(desiredItem, () =>
              this.getNextTradeAction()
            );
          }
        }
      }
      if (!trade.getAgentReadyStatus(ClientAPI.playerAgent)) {
        return new SetTradeState(true, () => this.getNextTradeAction());
      }
      return new IdleState(() => this.getNextTradeAction());
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
    return undefined;
  }

  // =============================== QUEST ACQUISITION LOGIC ==========================

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

  public static idleTransition(this: IdleAndConverseBehavior): BehaviorState {
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
          if (newQuest.task.action === "GAVE") {
            return CrimeGoon.instance.startGiveItemQuest();
          }
        }
      } else {
        return CrimePatrolBehavior.start(newQuest, CrimeGoon.patrolTransition);
      }
      console.log(ClientAPI.playerAgent + " unable to solve quest type!");
    }
    return this;
  }

  // ============================ PATROL QUEST LOGIC ====================================

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

  // ============================= QUESTION QUEST LOGIC =================================

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
    return this;
  }

  // ============================== GIVE ITEM QUEST LOGIC ==================================

  static readonly TIME_BEFORE_REPEAT = 60000;
  hasGivenItem: boolean;
  targetItem: Item;
  attemptedTrade: Map<Agent, number> = new Map<Agent, number>();
  investigatedRoom: Map<Room, number> = new Map<Room, number>();

  public startGiveItemQuest(): BehaviorState {
    this.hasGivenItem = false;
    this.targetItem = this.activeQuest.task.getTerms().item;
    this.attemptedTrade.clear();
    this.investigatedRoom.clear();
    return CrimeGoon.nextGiveItemQuestBehavior();
  }

  public static findMostRecentFactAboutItem(item: Item) {
    const itemInfo = ClientAPI.playerAgent.getInfoByItem(item);
    let latestInfo: Info = undefined;
    let time = 0;
    for (const info of itemInfo) {
      const terms = info.getTerms();
      if (terms.time > time && !info.isCommand() && !info.isQuery()) {
        latestInfo = info;
        time = terms.time;
      }
    }
    return latestInfo;
  }

  /**
   * dumb trade logic to give everything for desiredItem
   * @param this
   */
  public static tradeForItem(this: TradeBehavior): ActionState {
    const trade = ClientAPI.playerAgent.trade;
    if (trade) {
      const other = Helper.getOtherInTrade();
      if (
        trade.agentOfferedItem(other, CrimeGoon.instance.targetItem) &&
        !trade.getAgentReadyStatus(ClientAPI.playerAgent)
      ) {
        return new SetTradeState(true, () => this.getNextTradeAction());
      }
      const myReqItems = trade.getAgentsRequestedItems(ClientAPI.playerAgent);
      // make sure desired item has been requested
      if (!myReqItems.has(CrimeGoon.instance.targetItem)) {
        return new RequestItemTradeState(CrimeGoon.instance.targetItem, () =>
          this.getNextTradeAction()
        );
      }
      // agent has passed on what we want or we have waited too long
      else if (
        myReqItems.get(CrimeGoon.instance.targetItem) ||
        Date.now() - this.startTime > Helper.WAIT_FOR_OTHER
      ) {
        return FailureAction.instance;
      }
      // give other agent anything they want for it
      if (!trade.getAgentReadyStatus(other)) {
        for (const [desiredItem, passed] of trade.getAgentsRequestedItems(
          other
        )) {
          if (
            !trade
              .getAgentItemsData(ClientAPI.playerAgent)
              .includes(desiredItem)
          ) {
            if (ClientAPI.playerAgent.hasItem(desiredItem)) {
              return new OfferItemTradeState([desiredItem], () =>
                this.getNextTradeAction()
              );
            } else if (!passed) {
              return new PassItemReqTradeState(desiredItem, () =>
                this.getNextTradeAction()
              );
            }
          }
        }
      }
      return new IdleState(() => this.getNextTradeAction());
    }
    return SuccessAction.instance;
  }

  /**
   * Trade logic to give item freely to quest target
   * @param this
   */
  public static giveQuestItem(this: TradeBehavior): ActionState {
    const trade = ClientAPI.playerAgent.trade;
    const targetItem = CrimeGoon.instance.activeQuest.task.getTerms().item;
    if (trade) {
      if (!trade.agentOfferedItem(ClientAPI.playerAgent, targetItem)) {
        return new OfferItemTradeState([targetItem], () =>
          this.getNextTradeAction()
        );
      }
      if (!trade.getAgentReadyStatus(ClientAPI.playerAgent)) {
        return new SetTradeState(true, () => this.getNextTradeAction());
      }
      return new IdleState(() => this.getNextTradeAction());
    }
    CrimeGoon.instance.hasGivenItem = true;
    return SuccessAction.instance;
  }

  public static nextGiveItemQuestBehavior(): BehaviorState {
    const terms = this.instance.activeQuest.task.getTerms();
    if (!CrimeGoon.instance.hasGivenItem) {
      if (ClientAPI.playerAgent.hasItem(terms.item)) {
        if (ClientAPI.playerAgent.room.hasAgent(terms.agent2)) {
          return new TradeBehavior(
            terms.agent2,
            CrimeGoon.giveItemQuestTransition,
            CrimeGoon.giveQuestItem
          );
        } else {
          return NavigateToAgentBehavior.start(
            terms.agent2,
            CrimeGoon.giveItemQuestTransition
          );
        }
      }

      const latestInfo: Info = CrimeGoon.findMostRecentFactAboutItem(
        terms.item
      );
      if (latestInfo) {
        const terms = latestInfo.getTerms();
        if (
          latestInfo.action === "DROP" ||
          latestInfo.action === "LOCATED_IN"
        ) {
          const room = terms.loc;
          if (
            ClientAPI.playerAgent.room !== room &&
            (!this.instance.investigatedRoom.has(room) ||
              this.instance.investigatedRoom.get(room) < terms.time)
          ) {
            return NavigateToRoomBehavior.start(
              room,
              CrimeGoon.pickupItemNavigateTransition
            );
          } else if (ClientAPI.playerAgent.room.hasItem(terms.item)) {
            return new PickupItemBehavior(
              [terms.item],
              CrimeGoon.giveItemQuestTransition
            );
          }
        } else if (
          latestInfo.action === "PICKUP" ||
          latestInfo.action === "GAVE" ||
          latestInfo.action === "POSSESS"
        ) {
          const owner =
            latestInfo.action === "GAVE" ? terms.agent2 : terms.agent;
          // navigate to owner if they arent in our room
          if (!ClientAPI.playerAgent.room.hasAgent(owner)) {
            return NavigateToAgentBehavior.start(
              owner,
              CrimeGoon.pickupItemNavigateTransition
            );
          }
          // attempt trade if we havent recently
          if (
            !CrimeGoon.instance.attemptedTrade.has(owner) ||
            Date.now() - CrimeGoon.instance.attemptedTrade.get(owner) >
              CrimeGoon.TIME_BEFORE_REPEAT
          ) {
            CrimeGoon.instance.attemptedTrade.set(owner, Date.now());
            return new TradeBehavior(
              owner,
              CrimeGoon.giveItemQuestTransition,
              CrimeGoon.tradeForItem
            );
          }
          // steal if we have already attempted to trade
          else {
            return new StealBehavior(
              owner,
              terms.item,
              CrimeGoon.giveItemQuestTransition
            );
          }
        } else {
          console.log(ClientAPI.playerAgent + " uanble to process item info!");
        }
      }
      // randomly wander and try to trade for item
      for (const agent of Helper.getOthersInRoom()) {
        if (
          !CrimeGoon.instance.attemptedTrade.has(agent) ||
          Date.now() - CrimeGoon.instance.attemptedTrade.get(agent) >
            CrimeGoon.TIME_BEFORE_REPEAT
        ) {
          CrimeGoon.instance.attemptedTrade.set(agent, Date.now());
          return new TradeBehavior(
            agent,
            CrimeGoon.giveItemQuestTransition,
            CrimeGoon.tradeForItem
          );
        }
      }
      return new WanderRandomlyBehavior(CrimeGoon.pickupItemNavigateTransition);
    }
    // already has accomplished quest task
    else if (
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

  public static pickupItemNavigateTransition(
    this: BehaviorState
  ): BehaviorState {
    CrimeGoon.instance.investigatedRoom.set(ClientAPI.playerAgent.room, Date.now());
    if (ClientAPI.playerAgent.room.hasItem(CrimeGoon.instance.targetItem)) {
      return new PickupItemBehavior(
        [CrimeGoon.instance.targetItem],
        CrimeGoon.giveItemQuestTransition
      );
    } else if (
      this.currentActionState instanceof SuccessAction ||
      this.currentActionState instanceof FailureAction
    ) {
      return CrimeGoon.nextGiveItemQuestBehavior();
    }
    return this;
  }

  public static giveItemQuestTransition(this: BehaviorState): BehaviorState {
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
    if (
      this.currentActionState instanceof SuccessAction ||
      this.currentActionState instanceof FailureAction
    ) {
      return CrimeGoon.nextGiveItemQuestBehavior();
    }
    return this;
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

  // ============================ SHARED QUEST LOGIC ===============================

  private _questBehavior: BehaviorState; // Stores question behavior to transition back to

  public static turnInTransition(this: TurnInBehavior): BehaviorState {
    if (this.currentActionState instanceof SuccessAction) {
      console.log(
        ClientAPI.playerAgent + " turned in solution(s) for " + this.quest
      );
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
      Date.now() - this.startTime > Helper.WAIT_FOR_OTHER
    ) {
      return CrimeGoon.instance._questBehavior;
    }
    return this;
  }
}
