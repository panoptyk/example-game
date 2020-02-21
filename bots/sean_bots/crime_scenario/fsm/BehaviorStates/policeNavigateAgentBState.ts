import {
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior
} from "../../../../lib";
import { ClientAPI, Agent, Room } from "panoptyk-engine/dist/";
import { MoveState } from "../../../../utils";
import * as Helper from "../../../../utils/helper";

export class PoliceNavigateToAgent extends BehaviorState {
  targetAgent: Agent;
  timeout: number;
  lastLocation: Room;
  visitedLastLocation = false;
  private static _activeInstance: PoliceNavigateToAgent;
  public static get activeInstance(): PoliceNavigateToAgent {
    return PoliceNavigateToAgent._activeInstance;
  }

  constructor(
    targetAgent: Agent,
    timeout = Infinity,
    nextState: () => BehaviorState = undefined
  ) {
    super(nextState);
    this.targetAgent = targetAgent;
    this.timeout = timeout;
    this.lastLocation = Helper.findLastKnownLocation(this.targetAgent);
    this.currentActionState = new MoveState(
      this.lastLocation,
      PoliceNavigateToAgent.navigateTransition
    );
  }

  public async act() {
    PoliceNavigateToAgent._activeInstance = this;
    this.currentActionState = await this.currentActionState.tick();
  }

  public static navigateTransition(this: MoveState) {
    if (
      ClientAPI.playerAgent.room.hasAgent(
        PoliceNavigateToAgent.activeInstance.targetAgent
      )
    ) {
      return SuccessAction.instance;
    }
    if (this.doneActing) {
      let potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
      if (!PoliceNavigateToAgent.activeInstance.visitedLastLocation) {
        if (
          ClientAPI.playerAgent.room ===
          PoliceNavigateToAgent.activeInstance.lastLocation
        ) {
          PoliceNavigateToAgent.activeInstance.visitedLastLocation = true;
        } else {
          const dest = potentialRooms.find(
            room => room === PoliceNavigateToAgent.activeInstance.lastLocation
          );
          if (dest) {
            if (
              Helper.getPlayerRank(ClientAPI.playerAgent) <= 100 ||
              !dest.roomTags.has("private")
            ) {
              return new MoveState(
                dest,
                PoliceNavigateToAgent.navigateTransition
              );
            }
          }
        }
      }
      if (Helper.getPlayerRank(ClientAPI.playerAgent) > 100) {
        potentialRooms = potentialRooms.filter(
          room => !room.roomTags.has("private")
        );
      }
      return new MoveState(
        potentialRooms[Helper.randomInt(0, potentialRooms.length)],
        PoliceNavigateToAgent.navigateTransition
      );
    }
    return this;
  }

  public nextState(): BehaviorState {
    if (this.currentActionState instanceof SuccessAction) {
      return SuccessBehavior.instance;
    } else if (
      this.deltaTime > this.timeout ||
      this.currentActionState instanceof FailureAction
    ) {
      return FailureBehavior.instance;
    }
  }
}
