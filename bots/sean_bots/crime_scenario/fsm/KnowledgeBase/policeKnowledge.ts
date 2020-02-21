import { ClientAPI, Agent, Info, Item } from "panoptyk-engine/dist/";
import { KnowledgeBase } from "../../../../lib";

export class PoliceKnowledgeBase extends KnowledgeBase {
  criminals: Set<Agent> = new Set<Agent>();
  crimeDatabase: Set<Info> = new Set<Info>();
  infoIdx = 0;
  protected static _instance: PoliceKnowledgeBase;
  static get instance(): PoliceKnowledgeBase {
    if (!PoliceKnowledgeBase._instance) {
      PoliceKnowledgeBase._instance = new PoliceKnowledgeBase();
    }
    return PoliceKnowledgeBase._instance;
  }

  protected registerCrime(criminal: Agent, crime: Info) {
    // may need reworking as we manage the way death is handled and reported
    if (criminal && !criminal.agentStatus.has("dead")) {
      this.criminals.add(criminal);
    }
    this.crimeDatabase.add(crime);
  }

  public detectCrime() {
    const knowledge = ClientAPI.playerAgent.knowledge;
    for (this.infoIdx; this.infoIdx < knowledge.length; this.infoIdx++) {
      const info = knowledge[this.infoIdx];
      const terms = info.getTerms();
      const item: Item = terms.item;
      switch (info.action) {
        case "STOLE":
          this.registerCrime(terms.agent1, info);
        /* falls through */
        case "GAVE":
          if (item.itemTags.has("illegal")) {
            this.registerCrime(terms.agent1, info);
            this.registerCrime(terms.agent2, info);
          }
          break;
        case "PICKUP":
          if (item.itemTags.has("illegal")) {
            this.registerCrime(terms.agent, info);
          }
          break;
      }
    }
  }
}
