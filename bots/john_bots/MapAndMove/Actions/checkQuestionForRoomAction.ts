import { ActionState, KnowledgeBase } from "../../../lib";
import { TalkBehavior } from "../Behaviors/talkBehavior";
import { Room } from "panoptyk-engine/dist/client";

export class CheckQuestionForRoomAction extends ActionState {
  private roomFound = false;

  public get isRoomFound(): boolean {
    return this.roomFound;
  }

  constructor(nextState: () => ActionState) {
    super(nextState);
  }

  public async act() {
    const room: Room = KnowledgeBase.instance.questionAboutRoom();
    if (room !== undefined) {
      TalkBehavior.receiveRoom(room);
      console.log("Found room in a question: " + this.roomFound);
      this.roomFound = true;
    }
  }

  public nextState(): ActionState {
    return undefined;
  }
}
