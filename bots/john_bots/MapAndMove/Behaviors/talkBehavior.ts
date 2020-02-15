import { BehaviorState } from "../../../lib";
import { Room, Agent } from "panoptyk-engine/dist/client";

export class TalkBehavior extends BehaviorState {
  private static room: Room = undefined;
  private static agent: Agent;

  constructor(nextState: () => BehaviorState) {
    super (nextState);
  }


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

  public static get agentToTalkTo(): Agent {
    return TalkBehavior.agent;
  }

  public static assignAgentToTalkTo (agent: Agent) {
    TalkBehavior.agent = agent;
  }

  public nextState(): BehaviorState {
    return undefined;
  }
}
