import { RoomMap } from "./RoomMap";

export class KnowledgeBase {
  // Singleton Pattern
  private static _instance: KnowledgeBase;

  public static get instance(): KnowledgeBase {
    if (!KnowledgeBase._instance) {
      KnowledgeBase._instance = new KnowledgeBase();
    }
    return KnowledgeBase._instance;
  }

  public roomMap: RoomMap = new RoomMap ();

  
  private conversationRequest = false;

  public isConversationRequested (): boolean {
    return this.conversationRequest;
  }

  public conversationRequested (): void {
    this.conversationRequest = true;
  }

  public conversationAccepted (): void {
    this.conversationRequest = true;
  }
}
