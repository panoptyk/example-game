import { ActionState } from "../../../lib";
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
    ClientAPI.rejectConversation(FollowBehavior.followedAgent)
      .catch((res: ValidationResult) => {
        console.log(res.message);
      })
      .then(() => {
        console.log(
          "Rejected conversation with " + FollowBehavior.followedAgent
        );
        this.conversationDenied = true;
      });
  }

  public nextState(): ActionState {
    return undefined;
  }
}
