import {
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior,
  ActionState,
} from "../../../../lib";
import {
  ClientAPI,
  Agent,
  Room,
  getPanoptykDatetime,
} from "panoptyk-engine/dist/";
import {
  MoveState,
  IdleState,
  AcceptConersationState,
  LeaveConersationState,
  RequestTradeState,
  TellItemOwnershipState,
  PickupItemsState,
} from "../../../../utils";
import * as Helper from "../../../../utils/helper";
import { ListenToOther } from "../../../../utils/ActionStates/listenAState";
import { KnowledgeBase as KB } from "../KnowledgeBase/knowledgebase";

export class WanderingMerchantBehavior extends BehaviorState {
  idleTimeRoom: number;
  conversedAgents = new Set<Agent>();
  _path: Room[];
  _pathPos = 0;
  _destination: Room;
  private static _activeInstance: WanderingMerchantBehavior;
  public static get activeInstance(): WanderingMerchantBehavior {
    return this._activeInstance;
  }

  constructor(idleTimeRoom = 10000, nextState?: () => BehaviorState) {
    super(nextState);
    this.idleTimeRoom = idleTimeRoom;
    this.currentActionState = new IdleState(
      WanderingMerchantBehavior.idleTransition
    );
  }

  public async act() {
    WanderingMerchantBehavior._activeInstance = this;
    this.currentActionState = await this.currentActionState.tick();
  }

  static getGenericActions() {
    if (
      ClientAPI.playerAgent.room.getItems()[0] &&
      ClientAPI.playerAgent.inventory.length < 1
    ) {
      // const itemsToTake = [];
      // for (const item of ClientAPI.playerAgent.room.getItems()) {
      //   if (!item.itemTags.has("illegal")) {
      //     itemsToTake.push(item);
      //   }
      // }
      // if (itemsToTake.length > 0) {
      //   return new PickupItemsState(
      //     itemsToTake,
      //     WanderingMerchantBehavior.pickupItemsTransition
      //   );
      // }
      return new PickupItemsState(
        [ClientAPI.playerAgent.room.getItems()[0]],
        WanderingMerchantBehavior.pickupItemsTransition
      );
    }

    if (ClientAPI.playerAgent.conversation) {
      return new ListenToOther(
        Helper.WAIT_FOR_OTHER,
        WanderingMerchantBehavior.listenTransition
      );
    } else if (ClientAPI.playerAgent.conversationRequesters[0]) {
      return new AcceptConersationState(
        ClientAPI.playerAgent.conversationRequesters[0],
        WanderingMerchantBehavior.acceptConversationTransition
      );
    }
  }

  static idleTransition(this: IdleState) {
    const otherActions = WanderingMerchantBehavior.getGenericActions();
    if (otherActions) return otherActions;

    // location change depends on time of day
    const timeOfDay = new Date(getPanoptykDatetime()).getHours();
    const curRoom = ClientAPI.playerAgent.room;
    if (timeOfDay <= 7 && curRoom.roomName !== "Straw Roof Inn") {
      return WanderingMerchantBehavior.activeInstance.getNextMove(
        "Straw Roof Inn"
      );
    } else if (
      timeOfDay > 7 &&
      timeOfDay <= 12 &&
      curRoom.roomName !== "Redbrick Cafe"
    ) {
      return WanderingMerchantBehavior.activeInstance.getNextMove(
        "Redbrick Cafe"
      );
    } else if (timeOfDay > 12 && timeOfDay <= 17) {
      if (
        Date.now() - this.startTime >
        WanderingMerchantBehavior.activeInstance.idleTimeRoom
      ) {
        const potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
        return new MoveState(
          potentialRooms[Helper.randomInt(0, potentialRooms.length)],
          WanderingMerchantBehavior.moveTransition
        );
      }
    } else if (
      timeOfDay > 17 &&
      timeOfDay <= 23 &&
      curRoom.roomName !== "Crooked Sword Tavern (main)"
    ) {
      return WanderingMerchantBehavior.activeInstance.getNextMove(
        "Crooked Sword Tavern (main)"
      );
    }
    return this;
  }

  getNextMove(roomName: string) {
    const dest = Helper.getRoomByName(roomName);
    if (dest) {
      if (dest !== this._destination) {
        this._destination = dest;
        this._pathPos = 0;
        this._path = KB.instance.roomMap.findPath(
          ClientAPI.playerAgent.room,
          dest
        );
      }
      if (this._path) {
        return new MoveState(
          this._path[this._pathPos],
          WanderingMerchantBehavior.moveTransition
        );
      }
    }
    const potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
    if (potentialRooms.includes(dest)) {
      return new MoveState(
        dest,
        WanderingMerchantBehavior.moveTransition
      );
    }
    return new MoveState(
      potentialRooms[Helper.randomInt(0, potentialRooms.length)],
      WanderingMerchantBehavior.moveTransition
    );
  }

  static pickupItemsTransition(this: PickupItemsState) {
    if (this.doneActing) {
      return new IdleState(WanderingMerchantBehavior.idleTransition);
    }
    return this;
  }

  static acceptConversationTransition(this: AcceptConersationState) {
    if (ClientAPI.playerAgent.conversation) {
      if (
        !WanderingMerchantBehavior.activeInstance.conversedAgents.has(
          this.targetAgent
        )
      ) {
        WanderingMerchantBehavior.activeInstance.conversedAgents.add(
          this.targetAgent
        );
        return new TellItemOwnershipState(
          ClientAPI.playerAgent.inventory,
          WanderingMerchantBehavior.tellWaresTransition
        );
      }
      return new ListenToOther(
        Helper.WAIT_FOR_OTHER,
        WanderingMerchantBehavior.listenTransition
      );
    } else if (!this.completed && this.doneActing) {
      return new IdleState(WanderingMerchantBehavior.idleTransition);
    }
    return this;
  }

  static tellWaresTransition(this: TellItemOwnershipState) {
    if (this.completed || this.doneActing) {
      return new ListenToOther(
        Helper.WAIT_FOR_OTHER,
        WanderingMerchantBehavior.listenTransition
      );
    }
    return this;
  }

  static listenTransition(this: ListenToOther) {
    if (ClientAPI.playerAgent.conversation) {
      if (Date.now() - this.lastUpdate > this.timeout) {
        return new LeaveConersationState(
          WanderingMerchantBehavior.leaveTransition
        );
      }
    } else {
      return new IdleState(WanderingMerchantBehavior.idleTransition);
    }
    return this;
  }

  static leaveTransition(this: LeaveConersationState) {
    if (this.completed) {
      return new IdleState(WanderingMerchantBehavior.idleTransition);
    }
    return this;
  }

  static moveTransition(this: MoveState) {
    if (this.doneActing) {
      if (this.completed) {
        WanderingMerchantBehavior.activeInstance.conversedAgents.clear();
        if (WanderingMerchantBehavior.activeInstance._destination) {
          if (
            WanderingMerchantBehavior.activeInstance._destination ===
            ClientAPI.playerAgent.room
          ) {
            WanderingMerchantBehavior.activeInstance._destination = undefined;
            WanderingMerchantBehavior.activeInstance._path = undefined;
            WanderingMerchantBehavior.activeInstance._pathPos = 0;
          } else if (WanderingMerchantBehavior.activeInstance._path) {
            WanderingMerchantBehavior.activeInstance._pathPos++;
          }
        }
      }
      return new IdleState(WanderingMerchantBehavior.idleTransition);
    }
    return this;
  }

  public nextState() {
    return this;
  }
}
