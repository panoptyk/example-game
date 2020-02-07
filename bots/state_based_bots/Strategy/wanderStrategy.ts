import { Strategy } from "./strategy";
import { MoveState } from "../ActionStates/moveAState";
import { ActionState } from "../ActionStates/actionState";
import { IdleState } from "../ActionStates/idleAState";
import { Room, ClientAPI } from "panoptyk-engine/dist/client";
import { WanderBehavior } from "../BehaviorStates/wanderBState";

export class WanderStrategy extends Strategy {
  constructor() {
    super();
    const idle = new IdleState(WanderStrategy.idleTransition);
    this.currentBehavior = new WanderBehavior(idle);
  }

  public static idleTransition(this: IdleState): ActionState {
    if (Math.random() * 1000 < this.delay) {
      const adjacentRooms: Room[] = ClientAPI.playerAgent.room.getAdjacentRooms();
      return new MoveState(
        adjacentRooms[Math.floor(Math.random() * adjacentRooms.length)],
        WanderStrategy.moveTransition
      );
    } else {
      this.delay += this.deltaTime;
      return this;
    }
  }

  public static moveTransition(this: MoveState): ActionState {
    if (this.successfullyMoved()) {
      return new IdleState(WanderStrategy.idleTransition);
    } else {
      return this;
    }
  }
}
