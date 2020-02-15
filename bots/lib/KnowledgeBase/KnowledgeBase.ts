import { RoomMap } from "./RoomMap";
import { ClientAPI } from "panoptyk-engine";

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
}
