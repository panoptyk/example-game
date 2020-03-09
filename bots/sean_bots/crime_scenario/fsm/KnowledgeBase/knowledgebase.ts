import { ClientAPI, Agent, Info, Item } from "panoptyk-engine/dist/";

export class KnowledgeBase {
  protected static _instance: KnowledgeBase;
  static get instance(): KnowledgeBase {
    if (!KnowledgeBase._instance) {
      KnowledgeBase._instance = new KnowledgeBase();
    }
    return KnowledgeBase._instance;
  }

  static get factionLeader() {
    if (ClientAPI.playerAgent.faction) {
      for (const agent of ClientAPI.playerAgent.faction.members) {
        if (agent.factionRank === Infinity) {
          return agent;
        }
      }
    }
    return undefined;
  }
}
