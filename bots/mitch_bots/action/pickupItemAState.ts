import { ActionState, SuccessAction } from "../../lib";
import DELAYS from "../util/humanDelay";
import { RetryActionState } from "./retryActionState";
import { Item, ClientAPI } from "panoptyk-engine/dist/client";
import { log } from "../util/log";


export class PickupItemAction extends RetryActionState {
  _item: Item;
  _timeToWait: number;

  constructor(item: Item, timeout = 500, nextState?: () => ActionState) {
    super(timeout, nextState);
    this._item = item;
    this._timeToWait = DELAYS.getDelay("pickup-item");
  }

  async act() {
    if ((Date.now() - this.startTime) < this._timeToWait) {
      return;
    }
    await ClientAPI.takeItems([this._item]).then(res => {
      log("Picked up item: " + this._item, log.ACT);
      this._success = true;
    });
  }

  nextState(): ActionState {
    if (this._success) {
      return SuccessAction.instance;
    } else {
      return this;
    }
  }


}