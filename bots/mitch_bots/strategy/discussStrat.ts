import {
  Strategy,
  BehaviorState,
  SuccessBehavior,
  FailureBehavior
} from "../../lib";
import * as KB from "../kb/KBadditions";
import { Room, Agent } from "panoptyk-engine/dist/client";
import { DiscussBehavior } from "../behavior/discussBState";

/**
 * Handles any discussions requested or want to request
 *  this includes trading
 */
export class DiscussionStrategy extends Strategy {
  static createTransition(strat: Strategy): (this: any) => BehaviorState {
    return function(this: any): BehaviorState {
      return this;
    };
  }

  _target: Agent;
  complete = false;

  constructor(target: Agent) {
    super();
    this._target = target;
    this.currentBehavior = new DiscussBehavior(this._target);
  }

  async act() {
    await super.act();

    this.complete =
      this.currentBehavior === SuccessBehavior.instance ||
      this.currentBehavior === FailureBehavior.instance;
  }
}
