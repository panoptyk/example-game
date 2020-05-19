import { log } from "../util/log";
import DELAYS from "../util/humanDelay";
import { ActionState, SuccessAction } from "../../lib";
import { RetryActionState } from "./retryActionState";
import { ClientAPI, Item } from "panoptyk-engine/dist/client";

export class OfferInTradeAction extends RetryActionState {
  _offer: any;
  _isItem = false;
  _timeToWait;
  _waitTime = 0;

  constructor(offer: any, timeout = 3000, nextState?: () => ActionState) {
    super(timeout, nextState);
    this._offer = offer;
    this._isItem = this._offer instanceof Item;
    this._timeToWait = DELAYS.getDelay("trade-action");
  }

  async act() {
    this._waitTime += this.deltaTime;
    if (this._waitTime <= this._timeToWait) {
      return;
    }
    if (this._isItem) {
      await ClientAPI.offerItemsTrade([this._offer]).then(res => {
        log("Offered item in trade: " + this._offer, log.ACT);
        this._success = true;
      });
    } else {
      await ClientAPI.offerAnswerTrade(
        this._offer.answer,
        this._offer.question
      ).then(res => {
        log(
          "Offered answer" +
            this._offer.answer +
            " in trade to question" +
            this._offer.question,
          log.ACT
        );
        this._success = true;
      });
    }
  }
  nextState(): ActionState {
    if (this._success) {
      return SuccessAction.instance;
    } else {
      return this;
    }
  }
}
