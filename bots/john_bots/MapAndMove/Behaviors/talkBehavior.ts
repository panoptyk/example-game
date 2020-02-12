import { BehaviorState } from "../../../lib";
import { Room } from "panoptyk-engine";

export class TalkBehavior extends BehaviorState {
  private static room: Room = undefined;

  public static get receivedRoom(): Room {
    return TalkBehavior.receivedRoom;
  }

  public static useRoom(): Room {
    const temp: Room = TalkBehavior.room;
    TalkBehavior.room = undefined;
    return temp;
  }

  public static receiveRoom(room: Room): void {
    if (TalkBehavior.receivedRoom === undefined) {
      TalkBehavior.room = room;
    }
  }

  public nextState(): BehaviorState {
    return undefined;
  }
}
