export class KnowledgeBase {
  // Singleton Pattern
  private static _instance: KnowledgeBase;

  public static get instance(): KnowledgeBase {
    if (!KnowledgeBase._instance) {
      KnowledgeBase._instance = new KnowledgeBase();
    }
    return KnowledgeBase._instance;
  }
}
