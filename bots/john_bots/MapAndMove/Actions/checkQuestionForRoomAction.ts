import { ActionState, KnowledgeBase } from "../../../lib";
import { TalkBehavior } from "../Behaviors/talkBehavior";
import { Room } from "panoptyk-engine/dist/client";

export class CheckQuestionForRoomAction extends ActionState {
  private foundRoom = false;

  constructor (nextState: () => ActionState) {
    super (nextState);
  }

  public async act() {
    const room: Room = KnowledgeBase.instance.questionAboutRoom ();
    if (room !== undefined) {
      TalkBehavior.receiveRoom (room);
      this.foundRoom = true;
    }
  }

  public nextState(): ActionState {
    return undefined;
  }
}