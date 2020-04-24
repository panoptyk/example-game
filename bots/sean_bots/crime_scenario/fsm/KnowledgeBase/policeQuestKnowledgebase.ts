import { ClientAPI, Agent, Info, Quest, Item } from "panoptyk-engine/dist/";
import { KnowledgeBase } from "./knowledgebase";
import * as Helper from "../../../../utils/helper";
import { PoliceKnowledgeBase } from "./policeKnowledge";

export class PoliceQuestKnowledgeBase extends PoliceKnowledgeBase {
  private _assignedItemQuest = new Set<Item>();
  private _questingAgents = new Set<Agent>();
  public get questingAgents() {
    return this._questingAgents;
  }
  private _previousQuests = new Map<Agent, Quest[]>();
  public get previousQuests() {
    return this._previousQuests;
  }

  protected static _instance: PoliceQuestKnowledgeBase;
  public static get instance(): PoliceQuestKnowledgeBase {
    if (!this._instance) {
      this._instance = new PoliceQuestKnowledgeBase();
    }
    return this._instance;
  }

  protected registerQuest(quest: Quest) {
    const terms = quest.task.getTerms();
    if (quest.status === "ACTIVE") {
      this._questingAgents.add(quest.receiver);
      if (quest.type === "command") {
        if (
          quest.task.action === Info.ACTIONS.GAVE.name ||
          quest.task.action === Info.ACTIONS.DROP.name
        ) {
          this._assignedItemQuest.add(terms.item);
        }
        // open arrest quest
        else if (quest.task.action === Info.ACTIONS.ARRESTED.name) {
          const agent: Agent = quest.task.getTerms().agent2;
          this.crimeDatabase.set(agent, new Set());
          this.activeWarrants.add(agent);
          this.punishedCrimes.add(quest.reasonForQuest);
        }
      }
    } else {
      this._questingAgents.delete(quest.receiver);
      if (!this._previousQuests.has(quest.receiver)) {
        this._previousQuests.set(quest.receiver, []);
      }
      this._previousQuests.get(quest.receiver).push(quest);
      if (quest.type === "command") {
        // give quest close
        if (
          quest.task.action === Info.ACTIONS.GAVE.name ||
          quest.task.action === Info.ACTIONS.DROP.name
        ) {
          this._assignedItemQuest.delete(terms.item);
        }
        // arrest quest close
        else if (quest.task.action === Info.ACTIONS.ARRESTED.name) {
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
  }

  private constructor() {
    super();
  }

  public calcItemVal(item: Item) {
    let val = super.calcItemVal(item);
    if (!item.itemTags.has("illegal")) {
      val = 0;
    }
    return val;
  }

  public isValidQuestItem(item: Item): boolean {
    return (
      this.calcItemVal(item) > 0 &&
      this._unownedItems.has(item) &&
      !this._assignedItemQuest.has(item)
    );
  }

  public getSuitableReward(agent: Agent, task: any) {
    const rewards = [];
    switch (task.action) {
      case Info.ACTIONS.GAVE.name:
        rewards.push(Helper.makeQuestPromotionReward(agent, 10));
        break;
      case Info.ACTIONS.ARRESTED.name:
        rewards.push(Helper.makeQuestGoldReward(agent, 10));
        rewards.push(Helper.makeQuestPromotionReward(agent, 10));
        break;
    }
    if (!task.action) {
      rewards.push(Helper.makeQuestPromotionReward(agent, 5));
    }
    return rewards;
  }

  public getReasonForItemQuest(agent: Agent, item: Item) {
    return Helper.getLastInfoOnItem(item);
    // if (this._previousQuests.has(agent)) {
    //   for (const quest of this._previousQuests.get(agent)) {
    //     for (const turnIn of quest.turnedInInfo) {
    //       const terms = turnIn.getTerms();
    //       if (terms.item === item) {
    //         return turnIn;
    //       }
    //     }
    //   }
    // }
    // return undefined;
  }

  public get validQuestItems(): { key: Item; val: number }[] {
    const items = [];
    for (const item of this._unownedItems) {
      if (!this._assignedItemQuest.has(item)) {
        const val = this.calcItemVal(item);
        if (val > 0) items.push({ key: item, val });
      }
    }
    return items.sort((a, b) => b.val - a.val);
  }
}
