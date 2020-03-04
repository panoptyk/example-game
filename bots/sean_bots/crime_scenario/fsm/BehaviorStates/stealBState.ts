import { BehaviorState } from "../../../../lib";
import { Agent, Item } from "panoptyk-engine/dist/";
import { StealItemState } from "../ActionStates/stealItemAState";

/**
 * TODO: Expand behavior to deal with police, other factors
 */
export class StealBehavior extends BehaviorState {
  targetAgent: Agent;
  targetItem: Item;

  constructor(agent: Agent, item: Item, nextState?: () => BehaviorState) {
    super(nextState);
    this.targetAgent = agent;
    this.targetItem = item;
    this.currentActionState = new StealItemState(
      this.targetAgent,
      this.targetItem
    );
  }

  public async act() {
    this.currentActionState = await this.currentActionState.tick();
  }

  public nextState(): BehaviorState {
    return this;
  }
}
