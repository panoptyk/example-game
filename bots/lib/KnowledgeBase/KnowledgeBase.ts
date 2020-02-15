import { RoomMap } from "./RoomMap";
import { ClientAPI, Info, Room } from "panoptyk-engine";
import { QuestionInfo } from "panoptyk-engine/dist/models/conversation";

export class KnowledgeBase {
  // Singleton Pattern
  private static _instance: KnowledgeBase;

  public static get instance(): KnowledgeBase {
    if (!KnowledgeBase._instance) {
      KnowledgeBase._instance = new KnowledgeBase();
    }
    return KnowledgeBase._instance;
  }

  public roomMap: RoomMap = new RoomMap();

  public isConversationRequested(): boolean {
    if (ClientAPI.playerAgent.conversationRequesters.length > 0) {
      return true;
    }
    return false;
  }

  public questionAboutRoom(): Room {
    const questionsAsked: Info[] = ClientAPI.playerAgent.conversation.askedQuestions;
    questionsAsked.forEach(question => {
      if (question.locations.length > 0) {
        return Room.getByID (question.locations [0]);
      }
    });
    return undefined;
  }
}
