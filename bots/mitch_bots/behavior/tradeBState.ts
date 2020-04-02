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
import { EnterTradeAction } from "../action/enterTradeAState";
import { Agent, Item, Info } from "panoptyk-engine/dist/client";
import { PassOnRequestAction } from "../action/passOnRequestAState";
import { OfferInTradeAction } from "../action/offerInTradeAState";
import { ReadyInTradeAction } from "../action/readyInTradeAState";
import { RequestInTradeAction } from "../action/requestInTradeAState";

export class TradeBehavior extends BehaviorState {
  static createEnterTradeTransition(
    state: TradeBehavior
  ): (this: EnterTradeAction) => ActionState {
    return function(this: EnterTradeAction) {
      if (this._fail) {
        return FailureAction.instance;
      } else if (this._success) {
        log("Trading with " + state._target, log.ACT);
        state._enteredTrade = true;
        return SuccessAction.instance;
      }
      return this;
    };
  }

  _target: Agent;
  _enteredTrade = false;
  _timedOut = false;

  _lastAction: ActionState = undefined;
  _timeout = 45000;
  _lastActionTime = Date.now();

  _actionChoice = 0;

  constructor(target: Agent, nextState?: () => BehaviorState) {
    super(nextState);
    this._target = target;
    this._fail = !this._target || KB.get.otherAgentInConvo() !== this._target;
    if (this._complete) {
      this.currentActionState = SuccessAction.instance;
    } else {
      this.currentActionState = new EnterTradeAction(
        this._target,
        10000,
        TradeBehavior.createEnterTradeTransition(this)
      );
    }
  }

  async act() {
    await super.act();
    this.checkTimout();
    this._fail =
      this.currentActionState === FailureAction.instance ||
      KB.get.otherAgentInConvo() !== this._target;
    if (
      !this._fail &&
      this._enteredTrade &&
      this.currentActionState === SuccessAction.instance
    ) {
      // re-engage in trade
      if (!KB.get.otherAgentInTrade() && DECIDES.decide("trade-again")) {
        this._enteredTrade = false;
        this.currentActionState = new EnterTradeAction(
          this._target,
          7000,
          TradeBehavior.createEnterTradeTransition(this)
        );
        return;
      } else if (!KB.get.otherAgentInTrade()) {
        this._success = true;
        return;
      } else {
        // still in trade, decide next action
        this.decideNextTradeAction(this._actionChoice);
        this._actionChoice = (this._actionChoice + 1) % 3;
      }
    }
  }

  checkTimout() {
    if (this._lastAction !== this.currentActionState) {
      this._lastActionTime = Date.now();
    }
    this._lastAction = this.currentActionState;
    this._timedOut = Date.now() - this._lastActionTime > this._timeout;
  }

  decideNextTradeAction(state: number) {
    const status = this.tradeStatus();
    const player = KB.get.player;
    const trade = player.trade;
    const ready = trade.getAgentReadyStatus(player);
    const needs = KB.get.questNeeds();
    // make requests
    if (state === 0) {
      const requests = KB.get.tradeRequests();
      const open = requests.reduce((a, b) => {
        return a + (!b.pass ? 1 : 0);
      }, 0);
      if (open < 3) {
        for (const need of needs.items) {
          const asked = requests.findIndex(req => {
            return req.model instanceof Item && need.item.sameAs(req.model);
          }) !== -1;
          if (!asked && need.amount > KB.get.numberOwned(need.item)) {
            this.currentActionState = new RequestInTradeAction(need.item);
            return;
          }
        }
        for (const need of needs.tasks) {
          const asked = requests.findIndex(req => {
            return req.model instanceof Info && need.info.id === req.model.id;
          }) !== -1;
          if (!asked) {
            this.currentActionState = new RequestInTradeAction(need.info);
            return;
          }
        }
      }
    }

    // respond to requests
    if (state === 1) {
      const requests = KB.get.requestsByOtherAgent();
      for (const req of requests) {
        if (!req.pass && !KB.is.neededForQuest(req.model) && status > -1) {
          // potentially offer
          if (
            !(req.model instanceof Item) ||
            KB.is.itemInInventory(req.model)
          ) {
            const offer =
              req.model instanceof Item
                ? KB.get.inventory.find(item =>
                    item.sameAs(req.model as any)
                  )
                : KB.get.answerToQuestion(req.model as any);
            this.currentActionState = new OfferInTradeAction(offer);
            break;
          }
        } else if (!req.pass && DECIDES.decide("pass-request")) {
          // pass on request
          this.currentActionState = new PassOnRequestAction(req.model);
          break;
        }
      }
    }

    // ready trade
    if (state === 2 && !ready && status >= 0) {
      this.currentActionState = new ReadyInTradeAction();
    }
  }

  /**
   * if > 0: favors player
   * if = 0: even
   * if < 0: favors other
   */
  tradeStatus() {
    const myOffers = KB.get.numberOfOffers();
    const otherOffers = KB.get.numberOfOffersByOtherAgent();
    return myOffers - otherOffers;
  }

  nextState(): BehaviorState {
    if (this._success) {
      return SuccessBehavior.instance;
    } else if (this._fail || this._timedOut) {
      return FailureBehavior.instance;
    } else {
      return this;
    }
  }
}
