import { ClientAPI, Agent, Info, Quest, Item } from "panoptyk-engine/dist/";
import {
  Strategy,
  SuccessAction,
  FailureAction,
  BehaviorState,
  ActionState
} from "../../../../lib";
import {
  IdleState,
  TellInfo,
  NavigateToAgentBehavior,
  TradeBehavior,
  OfferItemTradeState,
  PassItemReqTradeState,
  SetTradeState,
  AnswerAllBehavior
} from "../../../../utils";
import * as Helper from "../../../../utils/helper";
import { PoliceKnowledgeBase as KB } from "../KnowledgeBase/policeKnowledge";
import { PoliceWatchBehavior } from "../BehaviorStates/policeWatchBehavior";

export class PoliceInformant extends Strategy {
  private static _instance: PoliceInformant;
  public static get instance(): PoliceInformant {
    if (!this._instance) {
      this._instance = new PoliceInformant();
    }
    return PoliceInformant._instance;
  }

  crimesToReport: Info[] = [];

  private constructor() {
    super();
    this.currentBehavior = PoliceWatchBehavior.start(() =>
      this.getNextBehavior()
    );
  }

  public async act() {
    KB.instance.parseInfo();
    this.currentBehavior = await this.currentBehavior.tick();
  }

  public getNextBehavior(): BehaviorState {
    for (const crime of KB.instance.allCrimes) {
      if (!KB.instance.punishedCrimes.has(crime)) {
        this.crimesToReport.push(crime);
        KB.instance.punishedCrimes.add(crime);
      }
    }
    if (
      ClientAPI.playerAgent.conversation &&
      Helper.getOthersInConversation()[0].faction ===
        ClientAPI.playerAgent.faction
    ) {
      const other = Helper.getOthersInConversation()[0];
      for (const question of ClientAPI.playerAgent.conversation
        .askedQuestions) {
        if (!AnswerAllBehavior.instance.answeredQuestions.has(question)) {
          return AnswerAllBehavior.start(() => this.getNextBehavior());
        }
      }
      if (ClientAPI.playerAgent.tradeRequesters.includes(other)) {
        return new TradeBehavior(
          other,
          () => this.getNextBehavior(),
          PoliceInformant.tradeRequestedItems
        );
      }
      if (this.crimesToReport[0]) {
        return new TellInfo(
          other,
          this.crimesToReport,
          PoliceInformant.tellCrimesTransition
        );
      }
    }
    if (this.crimesToReport[0]) {
      for (const other of Helper.getOthersInRoom()) {
        if (other.faction === ClientAPI.playerAgent.faction) {
          return new TellInfo(
            other,
            this.crimesToReport,
            PoliceInformant.tellCrimesTransition
          );
        }
      }
      return NavigateToAgentBehavior.start(
        KB.factionLeader,
        PoliceInformant.navigateToAgentTransition
      );
    }
    return this.currentBehavior instanceof PoliceWatchBehavior
      ? PoliceWatchBehavior.instance
      : PoliceWatchBehavior.start(() => this.getNextBehavior());
  }

  public static navigateToAgentTransition(this: BehaviorState): BehaviorState {
    for (const other of ClientAPI.playerAgent.room.occupants) {
      if (other.faction === ClientAPI.playerAgent.faction) {
        return new TellInfo(
          other,
          PoliceInformant.instance.crimesToReport,
          PoliceInformant.tellCrimesTransition
        );
      }
    }
    if (
      this.currentActionState instanceof SuccessAction ||
      this.currentActionState instanceof FailureAction
    ) {
      return PoliceInformant.instance.getNextBehavior();
    }
    return this;
  }

  public static tellCrimesTransition(this: BehaviorState): BehaviorState {
    if (
      this.currentActionState instanceof SuccessAction ||
      this.currentActionState instanceof FailureAction
    ) {
      if (this.currentActionState instanceof SuccessAction) {
        PoliceInformant.instance.crimesToReport = [];
      }
      return PoliceInformant.instance.getNextBehavior();
    }
    // try other members of faction if target is not accepting conversation
    for (const agent of ClientAPI.playerAgent.conversationRequesters) {
      if (agent.faction === ClientAPI.playerAgent.faction) {
        return new TellInfo(
          agent,
          PoliceInformant.instance.crimesToReport,
          PoliceInformant.tellCrimesTransition
        );
      }
    }
    return this;
  }

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
}
