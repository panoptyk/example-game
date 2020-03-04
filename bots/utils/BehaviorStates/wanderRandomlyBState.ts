import { BehaviorState } from "../../lib";
import { MoveState } from "../";
import { ClientAPI } from "panoptyk-engine/dist/";
import * as Helper from "../helper";

export class WanderRandomlyBehavior extends BehaviorState {
  constructor(nextState?: () => BehaviorState) {
    super(nextState);
    const neighbors = ClientAPI.playerAgent.room.getAdjacentRooms();
    this.currentActionState = new MoveState(
      neighbors[Helper.randomInt(0, neighbors.length)]
    );
  }

  public async act() {
    this.currentActionState = await this.currentActionState.tick();
  }

  public nextState() {
    return this;
  }
}
