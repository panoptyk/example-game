import {
  BehaviorState,
  SuccessAction,
  KnowledgeBase,
  FailureAction
} from "../../../lib";
import { Room, Agent, ClientAPI } from "panoptyk-engine/dist/client";
import { AcceptConversationAction } from "../Actions/acceptConversationAction";
import { CheckQuestionForRoomAction } from "../Actions/checkQuestionForRoomAction";
import { EndConversationAction } from "../Actions/endConversationAction";

export class TalkBehavior extends BehaviorState {
  private static room: Room = undefined;
  private static agent: Agent;

  constructor(nextState: () => BehaviorState) {
    super(nextState);
    this.currentActionState = new AcceptConversationAction(
      TalkBehavior.acceptConversationActionTransition
    );
  }

  public static get receivedRoom(): Room {
    return TalkBehavior.receivedRoom;
  }

  public static get agentToTalkTo(): Agent {
    return TalkBehavior.agent;
  }

  public static useRoom(): Room {
    const temp: Room = TalkBehavior.room;
    TalkBehavior.room = undefined;
    return temp;
  }

  public static receiveRoom(room: Room): void {
    if (TalkBehavior.room === undefined) {
      TalkBehavior.room = room;
    }
  }

  public static assignAgentToTalkTo(): boolean {
    const agentsRequestingConversation = ClientAPI.playerAgent.conversationRequesters;
    if (agentsRequestingConversation.length > 0) {
      TalkBehavior.agent = agentsRequestingConversation [0];
      return true;
    }
    return false;
  }

  public static acceptConversationActionTransition(
    this: AcceptConversationAction
  ) {
    if (this.isConversationAccepted) {
      return new CheckQuestionForRoomAction(
        TalkBehavior.checkQuestionForRoomActionTransition
      );
    }
    if (!KnowledgeBase.instance.isConversationRequested) {
      return FailureAction.instance;
    }
    return this;
  }

  public static checkQuestionForRoomActionTransition(
    this: CheckQuestionForRoomAction
  ) {
    if (this.isRoomFound) {
      if (ClientAPI.playerAgent.conversation !== undefined) {
        return new EndConversationAction(
          TalkBehavior.endConversationActionTransition
        );
      }
      return SuccessAction.instance;
    }
    if (ClientAPI.playerAgent.conversation === undefined) {
      return FailureAction.instance;
    }
    return this;
  }

  public static endConversationActionTransition(this: EndConversationAction) {
    if (this.isConversationLeft) {
      return SuccessAction.instance;
    }
    return this;
  }

  public nextState(): BehaviorState {
    return undefined;
  }
}
