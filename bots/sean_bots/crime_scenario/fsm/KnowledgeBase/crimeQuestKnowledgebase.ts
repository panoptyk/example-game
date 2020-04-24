import { ClientAPI, Agent, Info, Quest, Item } from "panoptyk-engine/dist/";
import { KnowledgeBase, AgentReputation } from "./knowledgebase";
import * as Helper from "../../../../utils/helper";

export class CrimeQuestKnowledgeBase extends KnowledgeBase {
  public readonly ACTION_RATINGS = {
    GAVE: 4,
    MOVE: 0,
    DROP: 1,
    PICKUP: -1,
    CONFISCATED: -4,
    ARRESTED: -10,
    ASSAULTED: -10,
    STOLE: -4,
    PAID: 1,
  };

  private _lastIdx = 0;
  private _closedGivenIdx = 0;
  private _unownedItems = new Set<Item>();
  private _unknownInfo = new Set<Info>();
  private _assignedInfoQuest = new Set<Info>();
  private _assignedItemQuest = new Set<Item>();
  private _questingAgents = new Set<Agent>();
  private _avengedActions = new Set<Info>();
  private _thankedActions = new Set<Info>();
  public get questingAgents() {
    return this._questingAgents;
  }
  private _previousQuests = new Map<Agent, Quest[]>();
  public get previousQuests() {
    return this._previousQuests;
  }
  private _agentScores = new Map<Agent, AgentReputation>();

  protected static _instance: CrimeQuestKnowledgeBase;
  public static get instance(): CrimeQuestKnowledgeBase {
    if (!this._instance) {
      this._instance = new CrimeQuestKnowledgeBase();
    }
    return this._instance;
  }

  private registerQuest(quest: Quest) {
    const terms = quest.task.getTerms();
    if (quest.status === "ACTIVE") {
      this._questingAgents.add(quest.receiver);
      if (quest.type === "command") {
        switch (quest.task.action) {
          case Info.ACTIONS.GAVE.name:
            this._assignedItemQuest.add(terms.item);
            break;
          case Info.ACTIONS.ASSAULTED.name:
            this._avengedActions.add(quest.reasonForQuest);
            break;
          case Info.ACTIONS.THANKED.name:
            this._thankedActions.add(quest.reasonForQuest);
            this._agentScores.get(terms.agent2).score = 1;
            console.log(this._agentScores.get(terms.agent2).score);
            break;
        }
      }
    } else {
      this._questingAgents.delete(quest.receiver);
      if (!this._previousQuests.has(quest.receiver)) {
        this._previousQuests.set(quest.receiver, []);
      }
      this._previousQuests.get(quest.receiver).push(quest);
      if (quest.type === "command") {
        switch (quest.task.action) {
          case Info.ACTIONS.GAVE.name:
            this._assignedItemQuest.delete(terms.item);
            break;
        }
      }
    }
  }

  private updateQuests() {
    /**
     * Closed quests must be processed first to determine who has
     * active quests
     * We use closedGivenIdx so we only have to process newly closed
     * quests
     */
    const closedGivenQuests = ClientAPI.playerAgent.closedGivenQuests;
    for (
      this._closedGivenIdx;
      this._closedGivenIdx < closedGivenQuests.length;
      this._closedGivenIdx++
    ) {
      this._questingAgents.delete(
        closedGivenQuests[this._closedGivenIdx].receiver
      );
      this.registerQuest(closedGivenQuests[this._closedGivenIdx]);
    }
    /**
     * We cannot use a persistent counter for active quests because this
     * list can shrink
     */
    for (const quest of ClientAPI.playerAgent.activeGivenQuests) {
      if (!this.questingAgents.has(quest.receiver)) {
        this.registerQuest(quest);
      }
    }
  }

  private calcEffectOfAction(action: Info) {
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
              : agent2.faction && agent2.faction.factionType === "police"
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
            : agent1.faction && agent1.faction.factionType === "police"
            ? -1
            : 0,
        memorableBad: [],
        memorableGood: [],
      });
    }
    const agentData = this._agentScores.get(agent1);
    agentData.score += score;
    if (score >= 2) {
      agentData.memorableGood.push(action);
    } else if (score <= -2) {
      agentData.memorableBad.push(action);
    }
    if (agentData.score > 100) agentData.score = 100;
    this._agentScores.set(agent1, agentData);
  }

  public parseInfo() {
    for (const item of this._unownedItems) {
      if (ClientAPI.playerAgent.hasItem(item)) {
        this._unownedItems.delete(item);
      }
    }

    for (
      this._lastIdx;
      this._lastIdx < ClientAPI.playerAgent.knowledge.length;
      this._lastIdx++
    ) {
      const info: Info = ClientAPI.playerAgent.knowledge[this._lastIdx];
      const terms = info.getTerms();
      if (info.isMasked() && !this._assignedInfoQuest.has(info)) {
        this._unknownInfo.add(info);
      } else {
        const item: Item = terms.item;
        if (item && !ClientAPI.playerAgent.hasItem(item)) {
          this._unownedItems.add(item);
        }
      }
      if (!info.isQuery() && !info.isCommand()) {
        this.calcEffectOfAction(info);
      }
    }
    this.updateQuests();
  }

  private constructor() {
    super();
  }

  public calcItemVal(item: Item) {
    let val = super.calcItemVal(item);
    if (item.itemTags.has("illegal")) {
      val = val * 2;
    }
    return val;
  }

  public isValidQuestItem(item: Item): boolean {
    return this._unownedItems.has(item) && !this._assignedItemQuest.has(item);
  }

  public getSuitableReward(agent: Agent, task: any) {
    const rewards = [];
    switch (task.action) {
      case Info.ACTIONS.GAVE.name:
        rewards.push(
          Helper.makeQuestGoldReward(agent, super.calcItemVal(task.item))
        );
        rewards.push(Helper.makeQuestPromotionReward(agent, 10));
        break;
      case Info.ACTIONS.ASSAULTED.name:
        rewards.push(Helper.makeQuestGoldReward(agent, 10));
        rewards.push(Helper.makeQuestPromotionReward(agent, 10));
        break;
      default:
        rewards.push(Helper.makeQuestPromotionReward(agent, 5));
        break;
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
        items.push({ key: item, val: this.calcItemVal(item) });
      }
    }
    return items.sort((a, b) => b.val - a.val);
  }

  public getValidRevengeTarget(agent: Agent): { target: Agent; reason: Info } {
    // take revenge on arrests
    for (const info of ClientAPI.playerAgent.getInfoByAction(
      Info.ACTIONS.ARRESTED.name
    )) {
      const terms = info.getTerms();
      if (
        !this._avengedActions.has(info) &&
        (terms.agent2 === agent || terms.agent2 === ClientAPI.playerAgent)
      ) {
        return { target: terms.agent1, reason: info };
      }
    }
    return undefined;
  }

  public getValidRewardTarget(agent: Agent): { target: Agent; reason: Info } {
    for (const [target, history] of this._agentScores) {
      if (
        target !== ClientAPI.playerAgent &&
        agent !== target &&
        history.score >= 10
      ) {
        for (const event of history.memorableGood) {
          if (!this._thankedActions.has(event)) {
            return { target, reason: event };
          }
        }
      }
    }
    return undefined;
  }
}
