import { ClientAPI, Agent, Info, Quest, Item } from "panoptyk-engine/dist/";
import {
  Strategy,
  SuccessAction,
  FailureAction,
  BehaviorState,
} from "../../../../lib";
import {
  IdleState,
  TellInfo,
  TurnInBehavior,
  GiveQuestBehavior,
  TradeBehavior,
  IdleAndConverseBehavior,
  CloseQuestBehavior,
} from "../../../../utils";
import * as Helper from "../../../../utils/helper";
import { CrimeQuestKnowledgeBase as KB } from "../KnowledgeBase/crimeQuestKnowledgebase";

export class CrimeLeader extends Strategy {
  private static _instance: CrimeLeader;
  public static get instance(): CrimeLeader {
    if (!this._instance) {
      this._instance = new CrimeLeader();
    }
    return CrimeLeader._instance;
  }

  private constructor() {
    super();
    this.currentBehavior = new IdleAndConverseBehavior(
      CrimeLeader.idleConverseTransition,
      CrimeLeader.idleConverseRequirement
    );
  }

  public async act() {
    KB.instance.parseInfo();
    this.currentBehavior = await this.currentBehavior.tick();
  }

  static isValidQuestingAgent(agent: Agent): boolean {
    if (
      ClientAPI.playerAgent.faction === agent.faction &&
      !KB.instance.questingAgents.has(agent)
    ) {
      return true;
    }
    return false;
  }

  getItemQuest(agent: Agent, item: Item, reason: Info) {
    console.log(ClientAPI.playerAgent + " is assigning item quest to " + agent);
    const relevantInfo = ClientAPI.playerAgent.getInfoByItem(item);
    const command = Helper.giveItemCommand(agent, item);
    return new GiveQuestBehavior(
      agent,
      command,
      false,
      relevantInfo,
      reason,
      KB.instance.getSuitableReward(agent, command),
      CrimeLeader.defaultTransition
    );
  }

  getExploreQuest(agent: Agent, reason: Info) {
    console.log(
      ClientAPI.playerAgent +
        " is assigning a generic explore for items quest to " +
        agent
    );
    const command = Helper.exploreItemsCommand(agent);
    return new GiveQuestBehavior(
      agent,
      command,
      false,
      [],
      reason,
      KB.instance.getSuitableReward(agent, command),
      CrimeLeader.defaultTransition
    );
  }

  assignQuestToIdleAgent(agent: Agent) {
    const itemsToQuest = KB.instance.validQuestItems;
    // attempt to make followup quest
    for (const { key, val } of itemsToQuest) {
      const reason = KB.instance.getReasonForItemQuest(agent, key);
      if (reason) {
        return this.getItemQuest(agent, key, reason);
      }
    }
    // item quest without followup
    if (itemsToQuest[0]) {
      return this.getItemQuest(agent, itemsToQuest[0].key, undefined);
    }

    // if we have no other quests to give
    return this.getExploreQuest(agent, undefined);
  }

  public static idleConverseTransition(
    this: IdleAndConverseBehavior
  ): BehaviorState {
    if (ClientAPI.playerAgent.conversation) {
      const other = Helper.getOthersInConversation()[0];
      const questToClose = CrimeLeader.instance.getQuestToClose(other);
      if (questToClose) {
        return new CloseQuestBehavior(
          questToClose,
          true,
          CrimeLeader.defaultTransition
        );
      }

      if (ClientAPI.playerAgent.tradeRequesters[0]) {
        return new TradeBehavior(
          ClientAPI.playerAgent.tradeRequesters[0],
          CrimeLeader.defaultTransition
        );
      } else if (CrimeLeader.isValidQuestingAgent(other)) {
        return CrimeLeader.instance.assignQuestToIdleAgent(other);
      }
    }
    // request idle agents to assign them quests
    else {
      for (const agent of Helper.getOthersInRoom()) {
        if (CrimeLeader.isValidQuestingAgent(agent)) {
          this.agentsToRequest.push(agent);
        }
      }
    }
    return this;
  }

  public getQuestToClose(other: Agent) {
    if (KB.instance.questingAgents.has(other)) {
      for (const quest of ClientAPI.playerAgent.activeGivenQuests) {
        // TODO: should be improved
        if (quest.receiver === other && quest.turnedInInfo[0]) {
          // check turn in for explore quest
          if (
            !quest.task.action &&
            quest.task.predicate === "TILQ" &&
            quest.type === "command"
          ) {
            for (const info of quest.turnedInInfo) {
              const terms = info.getTerms();
              if (!ClientAPI.playerAgent.hasItem(terms.item)) {
                return quest;
              }
            }
          }
          // check turn in for other quests
          else if (quest.turnedInInfo[0]) {
            return quest;
          }
        }
      }
    }
    return undefined;
  }

  public static defaultTransition(this: BehaviorState) {
    if (
      this.currentActionState instanceof SuccessAction ||
      this.currentActionState instanceof FailureAction
    ) {
      return new IdleAndConverseBehavior(
        CrimeLeader.idleConverseTransition,
        CrimeLeader.idleConverseRequirement
      );
    }
    return this;
  }

  public static idleConverseRequirement(agent: Agent) {
    if (ClientAPI.playerAgent.faction === agent.faction) {
      return true;
    }
    return false;
  }
}
