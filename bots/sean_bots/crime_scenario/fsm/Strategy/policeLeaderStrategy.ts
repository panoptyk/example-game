import {
  ActionState,
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior,
  Strategy
} from "../../../../lib";
import { ClientAPI, Agent, Info, Item, Quest } from "panoptyk-engine/dist/";
import * as Helper from "../../../../utils/helper";
import {
  IdleState,
  TellInfo,
  TurnInBehavior,
  GiveQuestBehavior,
  IdleAndConverseBehavior,
  CloseQuestBehavior,
  TradeBehavior
} from "../../../../utils";
import { PoliceQuestKnowledgeBase as KB } from "../KnowledgeBase/policeQuestKnowledgebase";

export class PoliceLeader extends Strategy {
  private static _activeInstance: PoliceLeader;
  public static get activeInstance(): PoliceLeader {
    return this._activeInstance;
  }

  constructor() {
    super();
    this.currentBehavior = new IdleAndConverseBehavior(
      PoliceLeader.idleConverseTransition
    );
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

  public async act() {
    PoliceLeader._activeInstance = this;
    KB.instance.parseInfo();
    this.currentBehavior = await this.currentBehavior.tick();
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
      PoliceLeader.genericTransition
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
      PoliceLeader.genericTransition
    );
  }

  getArrestQuest(agent: Agent, target: Agent, reason: Info) {
    console.log(
      ClientAPI.playerAgent + " is assigning an arrest quest to " + agent
    );
    const command = Info.ACTIONS.ARRESTED.question({
      agent1: agent,
      agent2: target,
      time: undefined,
      loc: undefined,
      info: reason
    });
    const relatedInfo = ClientAPI.playerAgent.getInfoByAgent(target);
    return new GiveQuestBehavior(
      agent,
      command,
      false,
      relatedInfo,
      reason,
      KB.instance.getSuitableReward(agent, command),
      PoliceLeader.genericTransition
    );
  }

  assignQuestToIdleAgent(agent: Agent) {
    // arrest quests are first priority
    for (const [other, crimes] of KB.instance.crimeDatabase) {
      for (const crime of crimes) {
        return this.getArrestQuest(agent, other, crime);
      }
    }

    // hunt down illegal items if no arrests
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
      const questToClose = PoliceLeader.activeInstance.getQuestToClose(other);
      if (questToClose) {
        return new CloseQuestBehavior(
          questToClose,
          true,
          PoliceLeader.genericTransition
        );
      }

      if (ClientAPI.playerAgent.tradeRequesters[0]) {
        return new TradeBehavior(
          ClientAPI.playerAgent.tradeRequesters[0],
          PoliceLeader.genericTransition
        );
      } else if (PoliceLeader.isValidQuestingAgent(other)) {
        return PoliceLeader.activeInstance.assignQuestToIdleAgent(other);
      }
    }
    // request idle agents to assign them quests
    else {
      for (const agent of Helper.getOthersInRoom()) {
        if (PoliceLeader.isValidQuestingAgent(agent)) {
          this.agentsToRequest.push(agent);
        }
      }
    }
    return this;
  }

  public getQuestToClose(other: Agent) {
    if (KB.instance.questingAgents.has(other)) {
      for (const quest of ClientAPI.playerAgent.activeGivenQuests) {
        if (quest.receiver === other && quest.turnedInInfo[0]) {
          return quest;
        }
      }
    }
    return undefined;
  }

  public static genericTransition(this: BehaviorState): BehaviorState {
    if (
      this.currentActionState instanceof SuccessAction ||
      this.currentActionState instanceof FailureAction
    ) {
      return new IdleAndConverseBehavior(PoliceLeader.idleConverseTransition);
    }
    return this;
  }
}
