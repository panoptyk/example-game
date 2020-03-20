import { BehaviorState, SuccessAction, FailureAction, SuccessBehavior, FailureBehavior } from "../../lib";
import * as KB from "../kb/KBadditions";
import { PickupItemAction } from "../action/pickupItemAState";
import { Item } from "panoptyk-engine/dist/client";

export class PickUpItemBehavior extends BehaviorState {
  _item: Item;

  constructor(item: Item, nextState?: () => BehaviorState) {
    super(nextState);
    this._item = item;
    this.currentActionState = new PickupItemAction(this._item, 750);
  }

  async act() {
    await super.act();
    this._success = this.currentActionState === SuccessAction.instance;
    this._fail =
      !KB.get.curRoom.hasItem(this._item) ||
      this.currentActionState === FailureAction.instance;
  }

  nextState(): BehaviorState {
    if (this._success) {
      return SuccessBehavior.instance;
    } else if (this._fail) {
      return FailureBehavior.instance;
    } else {
      return this;
    }
  }
}
