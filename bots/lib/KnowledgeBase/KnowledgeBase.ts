import { RoomMap } from "./RoomMap";
import { ClientAPI, Info, Room } from "panoptyk-engine/dist/client";
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
    let location: Room;
    if (ClientAPI.playerAgent.conversation !== undefined) {
      const questionsAsked: Info[] =
        ClientAPI.playerAgent.conversation.askedQuestions;
      if (questionsAsked.length > 0) {
        questionsAsked.forEach(question => {
          if (question.locations.length > 0) {
            let i = 0;
            while (i < question.locations.length) {
              if (question.locations[i] !== undefined) {
                location = Room.getByID(question.locations[i]);
                break;
              }
              i++;
            }
          }
        });
      }
    }
    return location;
  }
}
