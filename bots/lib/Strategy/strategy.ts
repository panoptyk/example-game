import { BehaviorState } from "../BehaviorStates/behaviorState";

export abstract class Strategy {
  public currentBehavior: BehaviorState;

  public async act() {
    this.currentBehavior = await this.currentBehavior.tick();
  }
}
