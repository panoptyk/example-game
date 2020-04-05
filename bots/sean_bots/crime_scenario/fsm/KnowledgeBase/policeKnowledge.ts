import { ClientAPI, Agent, Info, Item, Quest } from "panoptyk-engine/dist/";
import { KnowledgeBase, AgentReputation } from "./knowledgebase";

export class PoliceKnowledgeBase extends KnowledgeBase {
  public readonly ACTION_RATINGS = {
    GAVE: 2,
    MOVE: 0,
    DROP: -1,
    PICKUP: 1,
    CONFISCATED: -2,
    ARRESTED: -10,
    QUEST_COMPLETE: 10,
    QUEST_FAILED: -2,
  };

  protected _agentScores = new Map<Agent, AgentReputation>();
  protected _unownedItems = new Set<Item>();

  crimeDatabase: Map<Agent, Set<Info>> = new Map<Agent, Set<Info>>();
  punishedCrimes = new Set<Info>();
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
  protected registerQuest(quest: Quest) {
    if (quest.type === "command") {
      if (
        quest.task.action === Info.ACTIONS.ARRESTED.name &&
        quest.status === "ACTIVE"
      ) {
        const agent: Agent = quest.task.getTerms().agent2;
        this.crimeDatabase.set(agent, new Set());
        this.activeWarrants.add(agent);
        this.punishedCrimes.add(quest.reasonForQuest);
      }
      // arrest quest close
      else if (
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

  protected updateQuests() {
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

  protected constructor() {
    super();
  }

  protected registerCrime(criminal: Agent, crime: Info) {
    if (ClientAPI.playerAgent.faction === criminal.faction) {
      return;
    }
    if (
      criminal &&
      !criminal.agentStatus.has("dead") &&
      !this.activeWarrants.has(criminal) &&
      !this.punishedCrimes.has(crime)
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

  protected calcEffectOfAction(action: Info) {
    const terms = action.getTerms();
    const agent1: Agent = terms.agent1 ? terms.agent1 : terms.agent;
    if (!agent1) {
      return;
    }
    const agent2: Agent = terms.agent2;
    let score = this.ACTION_RATINGS[action.action]
      ? this.ACTION_RATINGS[action.action]
      : 0;
    if (agent2) {
      if (!this._agentScores.has(agent2)) {
        this._agentScores.set(agent2, {
          score:
            ClientAPI.playerAgent.faction === agent2.faction
              ? 1
              : agent2.faction && agent2.faction.factionType === "criminal"
              ? -1
              : 0,
          memorableBad: [],
          memorableGood: [],
        });
      }
      score *= this._agentScores.get(agent2).score;
    }
    if (!this._agentScores.has(agent1)) {
      this._agentScores.set(agent1, {
        score:
          ClientAPI.playerAgent.faction === agent1.faction
            ? 1
            : agent1.faction && agent1.faction.factionType === "criminal"
            ? -1
            : 0,
        memorableBad: [],
        memorableGood: [],
      });
    }
    const agentData = this._agentScores.get(agent1);
    agentData.score += score;
    if (score >= 10) {
      agentData.memorableGood.push(action);
    } else if (score <= -10) {
      agentData.memorableBad.push(action);
    }
    this._agentScores.set(agent1, agentData);
  }

  public parseInfo() {
    this.updateQuests();

    for (const item of this._unownedItems) {
      if (ClientAPI.playerAgent.hasItem(item)) {
        this._unownedItems.delete(item);
      }
    }

    const knowledge = ClientAPI.playerAgent.knowledge;
    for (this.infoIdx; this.infoIdx < knowledge.length; this.infoIdx++) {
      const info = knowledge[this.infoIdx];
      if (!info.isQuery() && !info.isCommand()) {
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
          case "DROP":
          case "PICKUP":
            if (item.itemTags.has("illegal")) {
              this.registerCrime(terms.agent, info);
            }
            break;
        }
        if (item && !ClientAPI.playerAgent.hasItem(item)) {
          this._unownedItems.add(item);
        }
        this.calcEffectOfAction(info);
      }
    }
  }
}
