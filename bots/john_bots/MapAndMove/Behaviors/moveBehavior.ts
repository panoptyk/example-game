import { BehaviorState } from "../../../lib";
import { Room } from "panoptyk-engine";
import { TalkBehavior } from "./talkBehavior";

export class MoveBehavior extends BehaviorState {
  public static destination: Room;

  constructor(nextState: () => BehaviorState) {
    super(nextState);
    MoveBehavior.destination = TalkBehavior.useRoom();
  }

  public nextState(): BehaviorState {
    return undefined;
  }
}
