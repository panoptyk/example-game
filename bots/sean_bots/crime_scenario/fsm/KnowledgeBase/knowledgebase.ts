import { ClientAPI, Agent, Info, Item } from "panoptyk-engine/dist/";

export class KnowledgeBase {
  protected static _instance: KnowledgeBase;
  static get instance(): KnowledgeBase {
    if (!KnowledgeBase._instance) {
      KnowledgeBase._instance = new KnowledgeBase();
    }
    return KnowledgeBase._instance;
  }
}
