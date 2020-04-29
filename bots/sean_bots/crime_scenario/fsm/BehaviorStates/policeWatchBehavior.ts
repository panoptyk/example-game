import {
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior,
  ActionState,
} from "../../../../lib";
import { ClientAPI } from "panoptyk-engine/dist/";
import {
  MoveState,
  IdleState,
  WaitState,
  AcceptConersationState,
  ListenToOther,
  LeaveConersationState,
  RejectConersationState,
} from "../../../../utils";
import * as Helper from "../../../../utils/helper";

export class PoliceWatchBehavior extends BehaviorState {
  private static _instance: PoliceWatchBehavior;
  public static get instance(): PoliceWatchBehavior {
    if (!this._instance) {
      this._instance = new PoliceWatchBehavior();
    }
    return this._instance;
  }

  firstInRoom = false; // so we don't have multiple bots watching same item

  protected constructor(nextState?: () => BehaviorState) {
    super(nextState);
    this.currentActionState = this.getNextAction();
  }

  checkIfFirst() {
    for (const other of Helper.getOthersInRoom()) {
      if (
        other.faction === ClientAPI.playerAgent.faction &&
        other.agentStatus.has("bot")
      ) {
        this.firstInRoom = false;
        return false;
      }
    }
    this.firstInRoom = true;
    return true;
  }

  public static start(nextState: () => BehaviorState) {
    this._instance = new PoliceWatchBehavior(nextState);
    this._instance.checkIfFirst();
    return this.instance;
  }

  public async act() {
    this.currentActionState = await this.currentActionState.tick();
  }

  public getNextAction() {
    if (ClientAPI.playerAgent.conversation) {
      return new ListenToOther(
        Helper.WAIT_FOR_OTHER,
        PoliceWatchBehavior.listenTransition
      );
    }
    for (const agent of ClientAPI.playerAgent.conversationRequesters) {
      if (agent.faction === ClientAPI.playerAgent.faction) {
        return new AcceptConersationState(
          agent,
          PoliceWatchBehavior.acceptConversationTransition
        );
      } else {
        return new RejectConersationState(
          agent,
          PoliceWatchBehavior.rejectConversationTransition
        );
      }
    }
    if (this.firstInRoom) {
      for (const item of ClientAPI.playerAgent.room.getItems()) {
        if (item.itemTags.has("illegal")) {
          return new IdleState(() => this.getNextAction());
        }
      }
    }
    let potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
    if (ClientAPI.playerAgent.factionRank < 10) {
      potentialRooms = potentialRooms.filter(
        (room) => !room.roomTags.has("private")
      );
    }
    return new WaitState(3000, () => {
      return new MoveState(
        potentialRooms[Helper.randomInt(0, potentialRooms.length)],
        PoliceWatchBehavior.moveTransition
      );
    });
  }

  static acceptConversationTransition(
    this: AcceptConersationState
  ): ActionState {
    if (this.completed || this.doneActing) {
      return PoliceWatchBehavior.instance.getNextAction();
    }
    return this;
  }

  static rejectConversationTransition(
    this: RejectConersationState
  ): ActionState {
    if (this.completed || this.doneActing) {
      return PoliceWatchBehavior.instance.getNextAction();
    }
    return this;
  }

  static listenTransition(this: ListenToOther) {
    if (ClientAPI.playerAgent.conversation) {
      if (Date.now() - this.lastUpdate > this.timeout) {
        return new LeaveConersationState(() =>
          PoliceWatchBehavior.instance.getNextAction()
        );
      }
    } else {
      return PoliceWatchBehavior.instance.getNextAction();
    }
    return this;
  }

  public static moveTransition(this: MoveState): ActionState {
    if (this.completed || this.doneActing) {
      PoliceWatchBehavior.instance.checkIfFirst();
      return PoliceWatchBehavior.instance.getNextAction();
    }
    return this;
  }

  public nextState(): BehaviorState {
    return this;
  }
}
