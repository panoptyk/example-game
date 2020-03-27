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

  static MAX_QUESTS = 4;
  static MIN_QUESTS = 1;
  static MAX_QUANTITY = 3;
  static MIN_QUANTITY = 1;

  static getMaxQuests(lvl: number) {
    return Math.min(
      QuestHelper.MAX_QUESTS,
      Math.max(QuestHelper.MIN_QUESTS, Math.floor(Math.random() * lvl))
    );
  }

  static getRandomQuantity(lvl: number) {
    return Math.min(
      QuestHelper.MAX_QUANTITY,
      Math.max(QuestHelper.MIN_QUANTITY, Math.floor(Math.random() * lvl))
    );
  }

  public faction: Faction;
  private possibleItems: number[];
  private itemBag: number[];
  private possibleQuestions: any[];
  private questionBag: any[];
  private possibleItems2: number[];
  private itemBag2: number[];
  private possibleQuestions2: any[];
  private questionBag2: any[];

  constructor() {
    this.possibleItems = [2, 3, 4, 5, 2, 3, 4, 5];
    this.itemBag = [];
    this.possibleQuestions = [];
    this.questionBag = [];
    this.possibleItems2 = [1, 6, 7, 8, 1, 6, 7, 8];
    this.itemBag2 = [];
    this.possibleQuestions2 = [];
    this.questionBag2 = [];

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
      predicate.agent = { id: agentID } as Agent;
      this.possibleQuestions.push(predicate);
    });

    // advanced questions
    // who GAVE who item?
    [1, 2, 3, 4, 5, 6, 7, 8].forEach(itemID => {
      const predicate = Info.ACTIONS.GAVE.getTerms(dummyInfo as Info);
      predicate.item = { id: itemID } as Item;
      this.possibleQuestions2.push(predicate);
    });
    // who told agent what?
    [2, 3, 4, 5, 6, 7, 8, 9].forEach(agentID => {
      const predicate = Info.ACTIONS.TOLD.getTerms(dummyInfo as Info);
      predicate.agent2 = { id: agentID } as Agent;
      this.possibleQuestions2.push(predicate);
    });
  }

  private checkOutstandingQuests(agent: Agent) {
    const maxQuest = QuestHelper.getMaxQuests(agent.factionStatus.lvl);
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

  // Ensures psuedo random fetch quests. Makes sure all items are requested then resets
  private getFetchItem2(): Item { // ADVANCED
    if (this.itemBag2.length <= 0) {
      this.itemBag2 = this.possibleItems2.slice(0);
    }
    const choice = Math.floor(this.itemBag2.length * Math.random());
    return Item.getByID(this.itemBag2.splice(choice, 1)[0]);
  }

  public async giveCraftsmenQuest(agent: Agent) {
    const lvl = agent.factionStatus.lvl;
    const quantity = QuestHelper.getRandomQuantity(lvl);
    const rewardXP = 35 * quantity;
    const fetchTarget: Item = lvl < 3 ? this.getFetchItem() : this.getFetchItem2();
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

  // Ensures psuedo random fetch quests. Makes sure all items are requested then resets
  private getQuery2(): any { // ADVANCED
    if (this.questionBag2.length <= 0) {
      this.questionBag2 = this.possibleQuestions2.slice(0);
    }
    const choice = Math.floor(this.questionBag2.length * Math.random());
    return this.questionBag2.splice(choice, 1)[0];
  }

  public async giveInformantsQuest(agent: Agent) {
    const lvl = agent.factionStatus.lvl;
    const quantity = QuestHelper.getRandomQuantity(lvl);
    const rewardXP = 35 * quantity;
    const query = lvl < 3 ? this.getQuery() : this.getQuery2();
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
