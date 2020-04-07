import {
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior,
  ActionState,
} from "../../../../lib";
import { ClientAPI, Agent, Room } from "panoptyk-engine/dist/";
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

export class WanderingMerchantBehavior extends BehaviorState {
  idleTimeRoom: number;
  conversedAgents = new Set<Agent>();
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

  static idleTransition(this: IdleState) {
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
    } else if (
      Date.now() - this.startTime >
      WanderingMerchantBehavior.activeInstance.idleTimeRoom
    ) {
      const potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
      return new MoveState(
        potentialRooms[Helper.randomInt(0, potentialRooms.length)],
        WanderingMerchantBehavior.moveTransition
      );
    }
    return this;
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
        return new IdleState(WanderingMerchantBehavior.idleTransition);
      }
      return FailureAction.instance;
    }
    return this;
  }

  public nextState() {
    return this;
  }
}
