import { ActionState } from "../../../lib";
import { ClientAPI } from "panoptyk-engine/dist/client";
import { TalkBehavior } from "../Behaviors/talkBehavior";

export class AcceptConversationAction extends ActionState {

  constructor (nextState: () => ActionState) {
    super (nextState);
  }

  public async act() {
    await ClientAPI.acceptConversation (TalkBehavior.agentToTalkTo);
  }

  public nextState(): ActionState {
    return undefined;
  }
}