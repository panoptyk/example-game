import {
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior,
  ActionState
} from "../../../../lib";
import { ClientAPI, Agent, Room, Quest, Info } from "panoptyk-engine/dist/";
import {
  MoveState,
  IdleState,
  AcceptConersationState,
  LeaveConersationState,
  RequestTradeState,
  TellItemOwnershipState,
  PickupItemsState
} from "../../../../utils";
import * as Helper from "../../../../utils/helper";
import { ListenToOther } from "../../../../utils/ActionStates/listenAState";

export class CrimePatrolBehavior extends BehaviorState {
  infoIdx = 0;
  solutions: Set<Info> = new Set<Info>();
  patrolQuest: Quest;
  targetRoom: Room;

  private static _instance: CrimePatrolBehavior;
  public static get instance(): CrimePatrolBehavior {
    if (!this._instance) {
      this._instance = new CrimePatrolBehavior();
    }
    return this._instance;
  }

  public static start(pQuest: Quest, nextState?: () => BehaviorState) {
    this._instance = new CrimePatrolBehavior(nextState);
    this.instance.patrolQuest = pQuest;
    this.instance.targetRoom = pQuest.task.getTerms().loc;
    this.instance.currentActionState = this.instance.getNextAction();
    return this.instance;
  }

  private processInfo() {
    const knowledge = ClientAPI.playerAgent.knowledge;
    for (this.infoIdx; this.infoIdx < knowledge.length; this.infoIdx++) {
      if (knowledge[this.infoIdx].isAnswer(this.patrolQuest.task)) {
        this.solutions.add(knowledge[this.infoIdx]);
      }
    }
  }

  public getNextRoom() {
    const potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
    const dest = potentialRooms.find(room => room === this.patrolQuest.task.getTerms().loc);
    if (dest) return dest;
    return potentialRooms[Helper.randomInt(0, potentialRooms.length)];
  }

  public getNextAction() {
    if (this.targetRoom !== ClientAPI.playerAgent.room) {
      const nextRoom = this.getNextRoom();
      return new MoveState(nextRoom, CrimePatrolBehavior.moveTransition);
    }
    this.processInfo();
    return new IdleState(this.getNextAction);
  }

  public async act() {
    this.currentActionState = await this.currentActionState.tick();
  }

  public static moveTransition(this: MoveState): ActionState {
    if (this.completed || this.doneActing) {
      return CrimePatrolBehavior.instance.getNextAction();
    }
    return this;
  }

  public nextState(): BehaviorState {
    return this;
  }
}
