import {
  ActionState,
  BehaviorState,
  SuccessAction,
  FailureAction
} from "../../lib";
import { ClientAPI, Info, Quest, Agent, Room } from "panoptyk-engine/dist/";
import * as Helper from "../helper";
import {
  LeaveConersationState,
  RequestConversationState,
  TurnInQuestInfoState,
  AskQuestionState,
  ListenToOther,
  MoveState
} from "..";

export class NavigateToAgentBehavior extends BehaviorState {
  target: Agent;
  lastKnownLoc: Room;
  visitedLastLoc = false;

  private static _instance: NavigateToAgentBehavior;
  public static get instance(): NavigateToAgentBehavior {
    if (!this._instance) {
      this._instance = new NavigateToAgentBehavior();
    }
    return NavigateToAgentBehavior._instance;
  }

  public static start(targetAgent: Agent, nextState?: () => BehaviorState) {
    this._instance = new NavigateToAgentBehavior(nextState);
    this.instance.target = targetAgent;
    this.instance.currentActionState = this.instance.getNextAction();
    return this.instance;
  }

  private getNextAction(): ActionState {
    if (ClientAPI.playerAgent.room.hasAgent(this.target)) {
      return SuccessAction.instance;
    }
    const locCheck = Helper.findLastKnownLocation(this.target);
    if (locCheck !== this.lastKnownLoc) {
      this.lastKnownLoc = locCheck;
      this.visitedLastLoc = false;
    }
    if (ClientAPI.playerAgent.room === this.lastKnownLoc) {
      this.visitedLastLoc = true;
    }
    // TODO: add better logic here later
    const neighbors = ClientAPI.playerAgent.room.getAdjacentRooms();
    if (!this.visitedLastLoc && neighbors.includes(this.lastKnownLoc)) {
      return new MoveState(this.lastKnownLoc, () => this.getNextAction());
    }
    return new MoveState(
      neighbors[Helper.randomInt(0, neighbors.length)],
      () => this.getNextAction()
    );
  }

  public async act() {
    this.currentActionState = await this.currentActionState.tick();
  }

  public nextState(): BehaviorState {
    return this;
  }
}
