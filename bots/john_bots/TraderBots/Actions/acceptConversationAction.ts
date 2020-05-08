import { ActionState } from "../../../lib";
import { ClientAPI, ValidationResult } from "panoptyk-engine/dist/client";
import { TalkBehavior } from "../Behaviors/talkBehavior";

export class AcceptConversationAction extends ActionState {
  private conversationAccepted = false;

  public get isConversationAccepted(): boolean {
    return this.conversationAccepted;
  }

  constructor(nextState: () => ActionState) {
    super(nextState);
  }

  public async act() {
    await ClientAPI.acceptConversation(TalkBehavior.agentToTalkTo)
      .catch((res: ValidationResult) => {
        console.log(res.message);
      })
      .then(() => {
        console.log("Accepted conversation with " + TalkBehavior.agentToTalkTo);
        this.conversationAccepted = true;
      });
  }

  public nextState(): ActionState {
    return undefined;
  }
}
