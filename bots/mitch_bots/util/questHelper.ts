import {
  Quest,
  Faction,
  Agent,
  ClientAPI,
  Item,
  Info
} from "panoptyk-engine/dist/client";
import * as KB from "../kb/KBadditions";

class QuestHelper {
  // Singleton pattern
  private static _instance: QuestHelper;
  public static get instance() {
    if (!QuestHelper._instance) {
      QuestHelper._instance = new QuestHelper();
    }
    return QuestHelper._instance;
  }

  public faction: Faction;
  private possibleItems: number[];
  private itemBag: number[];
  private possibleQuestions: any[];
  private questionBag: any[];

  constructor() {
    this.possibleItems = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
    this.itemBag = [];
    this.possibleQuestions = [];
    this.questionBag = [];

    const dummyInfo = {
      agents: [],
      items: [],
      locations: [],
      quantities: [],
      factions: []
    };
    // general questions about agents
    [2, 3, 4, 5, 6, 7, 8, 9].forEach(agentID => {
      const predicate = Info.PREDICATE.TAL.getTerms(dummyInfo as Info);
      predicate.agent = {id: agentID} as Agent;
      this.possibleQuestions.push(predicate);
    });
  }

  private checkOutstandingQuests(agent: Agent) {
    const maxQuest = Math.min(3, agent.factionStatus.lvl);
    return KB.get.questGivenToAgent(agent) < maxQuest;
  }

  public canGiveQuest(agent: Agent) {
    if (
      !ClientAPI.playerAgent ||
      !ClientAPI.playerAgent.faction ||
      !agent ||
      !agent.faction
    ) {
      return false;
    }
    return (
      ClientAPI.playerAgent.faction.id === agent.faction.id &&
      this.checkOutstandingQuests(agent)
    );
  }

  public async giveQuest(agent: Agent) {
    if (agent.faction.factionName === "Craftsmen") {
      await this.giveCraftsmenQuest(agent);
    } else if (agent.faction.factionName === "Informants") {
      await this.giveInformantsQuest(agent);
    }
  }

  // Ensures psuedo random fetch quests. Makes sure all items are requested then resets
  private getFetchItem(): Item {
    if (this.itemBag.length <= 0) {
      this.itemBag = this.possibleItems.slice(0);
    }
    const choice = Math.floor(this.itemBag.length * Math.random());
    return Item.getByID(this.itemBag.splice(choice, 1)[0]);
  }

  public async giveCraftsmenQuest(agent: Agent) {
    const quantity = Math.min(
      Math.max(1, Math.floor(Math.random() * 3)),
      agent.factionStatus.lvl
    );
    const rewardXP = 33 * quantity;
    const fetchTarget: Item = this.getFetchItem();
    await ClientAPI.giveQuest(
      agent,
      {},
      fetchTarget,
      "item",
      quantity,
      rewardXP
    );
  }

  // Ensures psuedo random fetch quests. Makes sure all items are requested then resets
  private getQuery(): any {
    if (this.questionBag.length <= 0) {
      this.questionBag = this.possibleQuestions.slice(0);
    }
    const choice = Math.floor(this.questionBag.length * Math.random());
    return this.questionBag.splice(choice, 1)[0];
  }

  public async giveInformantsQuest(agent: Agent) {
    const quantity = Math.min(
      Math.max(1, Math.floor(Math.random() * 3)),
      agent.factionStatus.lvl
    );
    const rewardXP = 33 * quantity;
    const query = this.getQuery();
    await ClientAPI.giveQuest(
      agent,
      query,
      { id: 0 } as Item,
      "question",
      quantity,
      rewardXP
    );
  }

  public async tryCompleteQuest() {
    const quests = ClientAPI.playerAgent.activeGivenQuests;
    for (const quest of quests) {
      if (quest.isComplete()) {
        await ClientAPI.completeQuest(quest);
        break;
      }
    }
  }

}

export default QuestHelper.instance;
export { QuestHelper };
