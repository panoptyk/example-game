import {
  ActionState,
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior
} from "../../../../lib";
import { ClientAPI, Agent, Quest } from "panoptyk-engine/dist/";
import {
  MoveState,
  IdleState,
  AcceptConersationState,
  LeaveConersationState
} from "../../../../utils";
import { PoliceArrestAgentState } from "../ActionStates/arrestAgentAState";

export class ArrestBehavior extends BehaviorState {
  _targetAgent: Agent;
  _warrant: Quest;
  private static _activeInstance: ArrestBehavior;
  public static get activeInstance(): ArrestBehavior {
    return ArrestBehavior._activeInstance;
  }

  constructor(
    targetAgent: Agent,
    warrant: Quest,
    nextState?: () => BehaviorState
  ) {
    super(nextState);
    this._targetAgent = targetAgent;
    this._warrant = warrant;
    if (ClientAPI.playerAgent.room.hasAgent(this._targetAgent)) {
      this.currentActionState = new PoliceArrestAgentState(
        this._targetAgent,
        ArrestBehavior.arrestTransition
      );
    } else {
      this.currentActionState = new IdleState(ArrestBehavior.idleTransition);
    }
  }

  public async act() {
    ArrestBehavior._activeInstance = this;
    this.currentActionState = await this.currentActionState.tick();
  }

  public static arrestTransition(this: PoliceArrestAgentState): ActionState {
    if (this.completed) {
      return SuccessAction.instance;
    } else if (this.doneActing) {
      return new IdleState(ArrestBehavior.idleTransition);
    }
    return this;
  }

  public static idleTransition(this: IdleState): ActionState {
    if (
      ClientAPI.playerAgent.room.hasAgent(
        ArrestBehavior.activeInstance._targetAgent
      )
    ) {
      return new PoliceArrestAgentState(
        ArrestBehavior.activeInstance._targetAgent,
        ArrestBehavior.arrestTransition
      );
    }
    return this;
  }

  public nextState(): BehaviorState {
    return this;
  }
}
