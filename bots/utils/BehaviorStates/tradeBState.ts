import {
  ActionState,
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior
} from "../../lib";
import { ClientAPI, Agent, Info } from "panoptyk-engine/dist/";
import * as Helper from "../helper";
import {
  LeaveConersationState,
  ListenToOther,
  IdleState,
  AcceptConersationState,
  RequestConversationState
} from "../";
import { RequestTradeState } from "../ActionStates/reqTradeAState";
import { SetTradeState } from "../ActionStates/setTradeStatusAState";

export class TradeBehavior extends BehaviorState {
  _targetAgent: Agent;
  private static _activeInstance: TradeBehavior;
  static get activeInstance(): TradeBehavior {
    return TradeBehavior._activeInstance;
  }

  constructor(
    targetAgent: Agent,
    nextState?: () => BehaviorState,
    tradeLogic?: () => ActionState
  ) {
    super(nextState);
    this._targetAgent = targetAgent;
    if (tradeLogic) {
      this.getNextTradeAction = tradeLogic;
    }

    if (ClientAPI.playerAgent.conversation) {
      if (ClientAPI.playerAgent.conversation.contains_agent(this._targetAgent)) {
        if (ClientAPI.playerAgent.trade) {
          this.currentActionState = new IdleState(() => this.getNextTradeAction());
        } else {
          this.currentActionState = new RequestTradeState(
            this._targetAgent,
            TradeBehavior.requestTradeTransition
          );
        }
      } else {
        this.currentActionState = new LeaveConersationState(
          TradeBehavior.leaveTransition
        );
      }
    } else {
      this.currentActionState = new RequestConversationState(
        this._targetAgent,
        TradeBehavior.requestConversationTransition
      );
    }
  }

  public async act() {
    TradeBehavior._activeInstance = this;
    this.currentActionState = await this.currentActionState.tick();
  }

  // default trade logic to accept any trade
  public getNextTradeAction(): ActionState {
    const trade = ClientAPI.playerAgent.trade;
    if (trade) {
      if (!trade.getAgentReadyStatus(ClientAPI.playerAgent)) {
        return new SetTradeState(true, () => this.getNextTradeAction());
      }
      return new IdleState(() => this.getNextTradeAction());
    }
    return SuccessAction.instance;
  }

  static requestConversationTransition(
    this: RequestConversationState
  ): ActionState {
    if (ClientAPI.playerAgent.conversation) {
      return new RequestTradeState(
        this.targetAgent,
        TradeBehavior.requestTradeTransition
      );
    } else if (
      (!this.completed && this.doneActing) ||
      Date.now() - this.startTime > Helper.WAIT_FOR_OTHER ||
      !ClientAPI.playerAgent.room.hasAgent(this.targetAgent)
    ) {
      return FailureAction.instance;
    }
    return this;
  }

  static leaveTransition(this: LeaveConersationState): ActionState {
    if (this.completed) {
      return new RequestConversationState(
        TradeBehavior.activeInstance._targetAgent,
        TradeBehavior.requestConversationTransition
      );
    }
    return this;
  }

  static requestTradeTransition(this: RequestTradeState): ActionState {
    if (ClientAPI.playerAgent.trade) {
      return TradeBehavior.activeInstance.getNextTradeAction();
    } else if (
      (!this.completed && this.doneActing) ||
      Date.now() - this.startTime > Helper.WAIT_FOR_OTHER
    ) {
      return FailureAction.instance;
    }
    return this;
  }

  public nextState() {
    return this;
  }
}
