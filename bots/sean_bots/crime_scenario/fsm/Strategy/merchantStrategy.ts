import { ClientAPI, Agent, Info, Quest, Item } from "panoptyk-engine/dist/";
import {
  Strategy,
  SuccessAction,
  FailureAction,
  ActionState,
  BehaviorState
} from "../../../../lib";
import {
  IdleState,
  TellInfo,
  TurnInBehavior,
  GiveQuestBehavior,
  TradeBehavior,
  OfferItemTradeState,
  PassItemReqTradeState,
  SetTradeState,
  TellItemOwnershipState
} from "../../../../utils";
import * as Helper from "../../../../utils/helper";
import { WanderingMerchantBehavior } from "../BehaviorStates/wanderingMerchant";

export class Merchant extends Strategy {
  private _infoIdx = 0;
  private _knownCriminals: Set<Agent> = new Set<Agent>();
  private _crimesToReport: Set<Info> = new Set<Info>();

  private static _instance: Merchant;
  public static get instance(): Merchant {
    if (!this._instance) {
      this._instance = new Merchant();
    }
    return Merchant._instance;
  }

  private constructor() {
    super();
    this.currentBehavior = new WanderingMerchantBehavior(
      Helper.WAIT_FOR_OTHER,
      Merchant.wanderTransition
    );
  }

  public async act() {
    this.detectCrimeOnSelf();
    this.currentBehavior = await this.currentBehavior.tick();
  }

  private markCrimeAndCriminal(criminal: Agent, crime: Info) {
    // may need reworking as we manage the way death is handled and reported
    if (criminal === undefined || !criminal.agentStatus.has("dead")) {
      if (criminal) this._knownCriminals.add(criminal);
      this._crimesToReport.add(crime);
    }
  }

  public detectCrimeOnSelf() {
    const knowledge = ClientAPI.playerAgent.knowledge;
    for (this._infoIdx; this._infoIdx < knowledge.length; this._infoIdx++) {
      const info = knowledge[this._infoIdx];
      const terms = info.getTerms();
      const item: Item = terms.item;
      switch (info.action) {
        case "STOLE":
          this.markCrimeAndCriminal(terms.agent1, info);
        /* falls through */
        case "GAVE":
          if (
            item.itemTags.has("illegal") &&
            terms.agent1 !== ClientAPI.playerAgent &&
            terms.agent2 !== ClientAPI.playerAgent
          ) {
            this.markCrimeAndCriminal(terms.agent1, info);
            this.markCrimeAndCriminal(terms.agent2, info);
          }
          break;
        case "PICKUP":
          if (
            item.itemTags.has("illegal") &&
            terms.agent !== ClientAPI.playerAgent
          ) {
            this.markCrimeAndCriminal(terms.agent, info);
          }
          break;
      }
    }
  }

  public static tradeLogic(this: TradeBehavior): ActionState {
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

      const desiredGold = trade.getAgentItemsData(ClientAPI.playerAgent).length;
      if (trade.getAgentsOfferedGold(other) >= desiredGold) {
        return new SetTradeState(true, () => this.getNextTradeAction());
      } else {
        return new SetTradeState(false, () => this.getNextTradeAction());
      }
    }
    return SuccessAction.instance;
  }

  public static wanderTransition(
    this: WanderingMerchantBehavior
  ): BehaviorState {
    if (ClientAPI.playerAgent.tradeRequesters[0]) {
      return new TradeBehavior(
        ClientAPI.playerAgent.tradeRequesters[0],
        Merchant.tradeTransition,
        Merchant.tradeLogic
      );
    } else if (Merchant.instance._crimesToReport.size > 0) {
      for (const other of Helper.getOthersInRoom()) {
        if (other.faction && other.faction.factionType === "police") {
          return new TellInfo(
            other,
            Array.from(Merchant.instance._crimesToReport),
            Merchant.reportCrimeTransition
          );
        }
      }
    }
    return this;
  }

  public static reportCrimeTransition(this: TellInfo) {
    if (
      this.currentActionState instanceof SuccessAction ||
      this.currentActionState instanceof FailureAction
    ) {
      if (this.currentActionState instanceof SuccessAction) {
        console.log(
          ClientAPI.playerAgent + " reported crimes to " + this._targetAgent
        );
        for (const info of this._toTell) {
          Merchant.instance._crimesToReport.delete(info);
        }
        if (Merchant.instance._crimesToReport.size > 0) {
          return new TellInfo(
            this._targetAgent,
            Array.from(Merchant.instance._crimesToReport),
            Merchant.reportCrimeTransition
          );
        }
      }
      return new WanderingMerchantBehavior(
        Helper.WAIT_FOR_OTHER,
        Merchant.wanderTransition
      );
    }
    return this;
  }

  public static tradeTransition(this: TradeBehavior): BehaviorState {
    if (
      this.currentActionState instanceof SuccessAction ||
      this.currentActionState instanceof FailureAction
    ) {
      return new WanderingMerchantBehavior(
        Helper.WAIT_FOR_OTHER,
        Merchant.wanderTransition
      );
    }
    return this;
  }
}
