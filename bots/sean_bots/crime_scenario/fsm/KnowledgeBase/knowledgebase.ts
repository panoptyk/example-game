import { ClientAPI, Agent, Info, Item } from "panoptyk-engine/dist/";

export interface AgentReputation {
  score: number;
  memorableBad: Info[];
  memorableGood: Info[];
}

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
        if (agent.factionRank >= 1000) {
          return agent;
        }
      }
    }
    return undefined;
  }

  public calcItemVal(item: Item) {
    let val: number;
    switch (item.type) {
      case "gold":
        val = item.quantity * 1;
        break;
      case "common":
        val = 5;
        break;
      case "rare":
        val = 10;
        break;
      case "legendary":
        val = 100;
        break;
      default:
        val = 1;
        break;
    }
    return val;
  }
}
