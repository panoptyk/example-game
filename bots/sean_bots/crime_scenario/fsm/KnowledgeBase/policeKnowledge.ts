import { ClientAPI, Agent, Info, Item, Quest } from "panoptyk-engine/dist/";
import { KnowledgeBase } from "./knowledgebase";

export class PoliceKnowledgeBase extends KnowledgeBase {
  crimeDatabase: Map<Agent, Set<Info>> = new Map<Agent, Set<Info>>();
  activeWarrants: Set<Agent> = new Set<Agent>();
  allCrimes: Set<Info> = new Set<Info>();
  infoIdx = 0;
  closedGivenIdx = 0;
  closedAssignedIdx = 0;
  protected static _instance: PoliceKnowledgeBase;
  static get instance(): PoliceKnowledgeBase {
    if (!PoliceKnowledgeBase._instance) {
      PoliceKnowledgeBase._instance = new PoliceKnowledgeBase();
    }
    return PoliceKnowledgeBase._instance;
  }

  /**
   * We don't want to arrest agents for crimes they have already
   * been arrested for or agents that already have
   * an active arrest warrant
   * @param quest
   */
  private registerQuest(quest: Quest) {
    if (quest.type === "command") {
      if (
        quest.task.action === Info.ACTIONS.ARRESTED.name &&
        quest.status === "ACTIVE"
      ) {
        const agent: Agent = quest.task.getTerms().agent2;
        this.crimeDatabase.set(agent, new Set());
        this.activeWarrants.add(agent);
      } else if (
        quest.task.action === Info.ACTIONS.ARRESTED.name &&
        quest.turnedInInfo[0]
      ) {
        const terms = quest.task.getTerms();
        const crimes = this.crimeDatabase.has(terms.agent2)
          ? this.crimeDatabase.get(terms.agent2)
          : [];
        const updatedCrimes = new Set<Info>();
        for (const crime of crimes) {
          if (quest.turnedInInfo[0].getTerms().time < crime.getTerms().time) {
            updatedCrimes.add(crime);
          }
        }
        this.crimeDatabase.set(terms.agent2, updatedCrimes);
        this.activeWarrants.delete(terms.agent2);
      }
    }
  }

  private updateQuests() {
    // most process closed quests first to ensure correct activeWarrants
    const closedAssignedQuests = ClientAPI.playerAgent.closedAssignedQuests;
    for (
      this.closedAssignedIdx;
      this.closedAssignedIdx < closedAssignedQuests.length;
      this.closedAssignedIdx++
    ) {
      this.registerQuest(closedAssignedQuests[this.closedAssignedIdx]);
    }
    const closedGivenQuests = ClientAPI.playerAgent.closedGivenQuests;
    for (
      this.closedGivenIdx;
      this.closedGivenIdx < closedGivenQuests.length;
      this.closedGivenIdx++
    ) {
      this.registerQuest(closedGivenQuests[this.closedGivenIdx]);
    }
    for (const quest of ClientAPI.playerAgent.activeGivenQuests) {
      this.registerQuest(quest);
    }
    for (const quest of ClientAPI.playerAgent.activeAssignedQuests) {
      this.registerQuest(quest);
    }
  }

  private constructor() {
    super();
    this.detectCrime();
  }

  protected registerCrime(criminal: Agent, crime: Info) {
    if (
      criminal &&
      !criminal.agentStatus.has("dead") &&
      !this.activeWarrants.has(criminal)
    ) {
      if (!this.crimeDatabase.has(criminal)) {
        this.crimeDatabase.set(criminal, new Set([crime]));
      } else {
        this.crimeDatabase.set(
          criminal,
          this.crimeDatabase.get(criminal).add(crime)
        );
      }
    }
    this.allCrimes.add(crime);
  }

  public detectCrime() {
    this.updateQuests();
    const knowledge = ClientAPI.playerAgent.knowledge;
    for (this.infoIdx; this.infoIdx < knowledge.length; this.infoIdx++) {
      const info = knowledge[this.infoIdx];
      const terms = info.getTerms();
      const item: Item = terms.item;
      switch (info.action) {
        case "STOLE":
          this.registerCrime(terms.agent1, info);
          break;
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
