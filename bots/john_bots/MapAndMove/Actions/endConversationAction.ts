import { ActionState } from "../../../lib";
import { ClientAPI, ValidationResult } from "panoptyk-engine";
import { TalkBehavior } from "../Behaviors/talkBehavior";

export class EndConversationAction extends ActionState {
  private conversationLeft = false;

  public get isConversationLeft(): boolean {
    return this.conversationLeft;
  }
  constructor(nextState: () => ActionState) {
    super(nextState);
  }

  public async act() {
    await ClientAPI.leaveConversation(ClientAPI.playerAgent.conversation)
      .catch((res: ValidationResult) => {
        console.log(res.message);
      })
      .then(() => {
        console.log(
          "Conversation with " + TalkBehavior.agentToTalkTo + " left."
        );
        this.conversationLeft = true;
      });
  }

  public nextState(): ActionState {
    return undefined;
  }
}
