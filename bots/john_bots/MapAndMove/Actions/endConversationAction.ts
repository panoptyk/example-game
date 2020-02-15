import { ActionState } from "../../../lib";
import { ClientAPI } from "panoptyk-engine";

export class EndConversationAction extends ActionState {
  constructor(nextState: () => ActionState) {
    super (nextState);
  }

  public async act() {
    await ClientAPI.leaveConversation (ClientAPI.playerAgent.conversation);
  }

  public nextState(): ActionState {
    return undefined;
  }
}