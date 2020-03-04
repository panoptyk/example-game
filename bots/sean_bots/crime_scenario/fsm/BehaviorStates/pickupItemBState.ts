import { BehaviorState } from "../../../../lib";
import { Agent, Item } from "panoptyk-engine/dist/";
import { StealItemState } from "../ActionStates/stealItemAState";
import { PickupItemsState } from "../../../../utils";

/**
 * TODO: Expand behavior to deal with illegal items, police, other factors
 */
export class PickupItemBehavior extends BehaviorState {
  targetItems: Item[];

  constructor(items: Item[], nextState?: () => BehaviorState) {
    super(nextState);
    this.targetItems = items;
    this.currentActionState = new PickupItemsState(this.targetItems);
  }

  public async act() {
    this.currentActionState = await this.currentActionState.tick();
  }

  public nextState(): BehaviorState {
    return this;
  }
}
