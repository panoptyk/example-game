import {
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior
} from "../../../../lib";
import { ClientAPI } from "panoptyk-engine/dist/";
import { MoveState } from "../../../../utils";
import * as Helper from "../../../../utils/helper";

export class PoliceNavigate extends BehaviorState {
  destName: string;
  timeout: number;
  private static _activeInstance: PoliceNavigate;
  public static get activeInstance(): PoliceNavigate {
    return PoliceNavigate._activeInstance;
  }

  constructor(
    dest: string,
    timeout = Infinity,
    nextState: () => BehaviorState = undefined
  ) {
    super(nextState);
    this.destName = dest;
    this.timeout = timeout;
    this.currentActionState = new MoveState(
      ClientAPI.playerAgent.room,
      PoliceNavigate.navigateTransition
    );
  }

  public async act() {
    PoliceNavigate._activeInstance = this;
    this.currentActionState = await this.currentActionState.tick();
  }

  public static navigateTransition(this: MoveState) {
    if (this.doneActing) {
      if (
        PoliceNavigate.activeInstance.destName === this.destination.roomName
      ) {
        return SuccessAction.instance;
      } else {
        let potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
        const dest = potentialRooms.find(
          room => room.roomName === PoliceNavigate.activeInstance.destName
        );
        if (dest) {
          if (
            Helper.getPlayerRank(ClientAPI.playerAgent) >= 10 ||
            !dest.roomTags.has("private")
          ) {
            return new MoveState(dest, PoliceNavigate.navigateTransition);
          } else {
            return FailureAction.instance;
          }
        } else {
          if (Helper.getPlayerRank(ClientAPI.playerAgent) < 10) {
            potentialRooms = potentialRooms.filter(
              room => !room.roomTags.has("private")
            );
          }
          return new MoveState(
            potentialRooms[Helper.randomInt(0, potentialRooms.length)],
            PoliceNavigate.navigateTransition
          );
        }
      }
    }
    return this;
  }

  public nextState(): BehaviorState {
    if (this.currentActionState instanceof SuccessAction) {
      return SuccessBehavior.instance;
    } else if (
      Date.now() - this.startTime > this.timeout ||
      this.currentActionState instanceof FailureAction
    ) {
      return FailureBehavior.instance;
    }
  }
}
