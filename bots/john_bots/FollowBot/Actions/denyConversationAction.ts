import { ActionState, KnowledgeBase } from "../../../lib";
import { ClientAPI, ValidationResult } from "panoptyk-engine/dist/client";
import { FollowBehavior } from "../Behaviors/followBehavior";

export class DenyConversationAction extends ActionState {
  private conversationDenied = false;

  public get isConversationDenied(): boolean {
    return this.conversationDenied;
  }

  constructor(nextState: () => ActionState) {
    super(nextState);
  }

  public async act() {
    if (KnowledgeBase.instance.isConversationRequested()) {
      await ClientAPI.rejectConversation(
        ClientAPI.playerAgent.conversationRequesters[0]
      )
        .catch((res: ValidationResult) => {
          console.log(res.message);
        })
        .then(() => {
          console.log(
            "Rejected conversation with " + FollowBehavior.followedAgent
          );
          this.conversationDenied = true;
          FollowBehavior.conversationDenied();
        });
    } else {
      this.conversationDenied = true;
      FollowBehavior.conversationDenied();
    }
  }

  public nextState(): ActionState {
    return undefined;
  }
}
