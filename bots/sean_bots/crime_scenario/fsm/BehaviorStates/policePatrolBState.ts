import {
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior
} from "../../../../lib";
import { ClientAPI, Agent, Room } from "panoptyk-engine/dist/";
import {
  MoveState,
  IdleState,
  AcceptConersationState,
  LeaveConersationState
} from "../../../../utils";
import * as Helper from "../../../../utils/helper";
import { ListenToOther } from "../../../../utils/ActionStates/listenAState";

export class PolicePatrol extends BehaviorState {
  idleTimeRoom: number;
  conversedAgents = new Set<Agent>();
  private static _activeInstance: PolicePatrol;
  public static get activeInstance(): PolicePatrol {
    return this._activeInstance;
  }

  constructor(idleTimeRoom = 10000, nextState?: () => BehaviorState) {
    super(nextState);
    this.idleTimeRoom = idleTimeRoom;
    this.currentActionState = new IdleState(PolicePatrol.idleTransition);
  }

  public async act() {
    PolicePatrol._activeInstance = this;
    this.currentActionState = await this.currentActionState.tick();
  }

  static idleTransition(this: IdleState) {
    if (ClientAPI.playerAgent.conversationRequesters[0]) {
      return new AcceptConersationState(
        ClientAPI.playerAgent.conversationRequesters[0],
        PolicePatrol.acceptConversationTransition
      );
    } else if (
      Date.now() - this.startTime >
      PolicePatrol.activeInstance.idleTimeRoom
    ) {
      let potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
      if (Helper.getPlayerRank(ClientAPI.playerAgent) > 100) {
        potentialRooms = potentialRooms.filter(
          room => !room.roomTags.has("private")
        );
      }
      return new MoveState(
        potentialRooms[Helper.randomInt(0, potentialRooms.length)],
        PolicePatrol.moveTransition
      );
    }
    return this;
  }

  static acceptConversationTransition(this: AcceptConersationState) {
    if (ClientAPI.playerAgent.conversation) {
      return new ListenToOther(
        Helper.WAIT_FOR_OTHER,
        PolicePatrol.listenTransition
      );
    } else if (!this.completed && this.doneActing) {
      return new IdleState(PolicePatrol.idleTransition);
    }
    return this;
  }

  static listenTransition(this: ListenToOther) {
    if (Date.now() - this.lastUpdate > this.timeout) {
      return new LeaveConersationState(PolicePatrol.leaveTransition);
    }
    return this;
  }

  static leaveTransition(this: LeaveConersationState) {
    if (this.completed) {
      return new IdleState(PolicePatrol.idleTransition);
    }
    return this;
  }

  static moveTransition(this: MoveState) {
    if (this.doneActing) {
      if (this.completed) {
        PolicePatrol.activeInstance.conversedAgents.clear();
        return new IdleState(PolicePatrol.idleTransition);
      }
      return FailureAction.instance;
    }
    return this;
  }

  public nextState() {
    return this;
  }
}
