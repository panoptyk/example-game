import { ClientAPI, Agent, Info, Quest, Item } from "panoptyk-engine/dist/";
import {
  Strategy,
  SuccessAction,
  FailureAction,
  BehaviorState
} from "../../../../lib";
import {
  IdleState,
  TellInfo,
  TurnInBehavior,
  GiveQuestBehavior,
  TradeBehavior,
  IdleAndConverseBehavior,
  CloseQuestBehavior
} from "../../../../utils";
import * as Helper from "../../../../utils/helper";

export class CrimeLeader extends Strategy {
  private _lastIdx = 0;
  private _unassignedInfoQuest = new Set<Info>();
  private _assignedInfoQuest = new Set<Info>();
  private _unassignedItemQuest = new Set<Item>();
  private _assignedItemQuest = new Set<Item>();
  private _assignedAgents = new Set<Agent>();

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
    this.loadQuests();
  }

  public async act() {
    this.parseInfo();
    this.currentBehavior = await this.currentBehavior.tick();
  }

  private loadQuests() {
    for (const quest of ClientAPI.playerAgent.activeGivenQuests) {
      if (quest.task.action) {
        this._assignedAgents.add(quest.receiver);
        if (quest.type === "question") {
          this._assignedInfoQuest.add(quest.task);
        } else if (quest.type === "command") {
          this._assignedItemQuest.add(quest.task.getTerms().item);
        }
      }
    }
  }

  private parseInfo() {
    for (
      this._lastIdx;
      this._lastIdx < ClientAPI.playerAgent.knowledge.length;
      this._lastIdx++
    ) {
      const info: Info = ClientAPI.playerAgent.knowledge[this._lastIdx];
      if (info.isMasked() && !this._assignedInfoQuest.has(info)) {
        this._unassignedInfoQuest.add(info);
      } else {
        const item: Item = info.getTerms().item;
        if (
          item &&
          !ClientAPI.playerAgent.hasItem(item) &&
          !this._assignedItemQuest.has(item)
        ) {
          this._unassignedItemQuest.add(item);
        }
      }
    }
  }

  static isValidQuestingAgent(agent: Agent): boolean {
    if (
      ClientAPI.playerAgent.faction === agent.faction &&
      !this.instance._assignedAgents.has(agent)
    ) {
      return true;
    }
    return false;
  }

  hasQuestToAssign(): boolean {
    if (
      this._unassignedInfoQuest.size > 0 ||
      this._unassignedItemQuest.size > 0
    ) {
      return true;
    }
    return false;
  }

  giveQuestBehavior(agent: Agent) {
    for (const info of this._unassignedInfoQuest) {
      this._unassignedInfoQuest.delete(info);
      this._assignedInfoQuest.add(info);
      const relevantInfo = Helper.getAllRelatedInfo(info);
      return new GiveQuestBehavior(
        agent,
        info.getTerms(),
        true,
        relevantInfo,
        CrimeLeader.giveQuestTransition
      );
    }
    for (const item of this._unassignedItemQuest) {
      this._unassignedItemQuest.delete(item);
      this._assignedItemQuest.add(item);
      const relevantInfo = ClientAPI.playerAgent.getInfoByItem(item);
      const command = Info.ACTIONS.GAVE.question({
        agent1: undefined,
        agent2: ClientAPI.playerAgent,
        time: undefined,
        loc: undefined,
        item,
        quantity: 1
      });
      return new GiveQuestBehavior(
        agent,
        command,
        false,
        relevantInfo,
        CrimeLeader.giveQuestTransition
      );
    }
  }

  public static idleConverseTransition(this: IdleAndConverseBehavior) {
    if (ClientAPI.playerAgent.conversation) {
      const other = Helper.getOthersInConversation()[0];
      if (CrimeLeader.instance._assignedAgents.has(other)) {
        for (const quest of ClientAPI.playerAgent.activeGivenQuests) {
          if (quest.receiver === other && quest.turnedInInfo[0]) {
            // complete action quests but leave patrol quests open
            if (quest.task.action) {
              return new CloseQuestBehavior(
                quest,
                true,
                CrimeLeader.defaultTransition
              );
            }
          }
        }
        // no more active quests for agent
        CrimeLeader.instance._assignedAgents.delete(other);
      }

      if (ClientAPI.playerAgent.tradeRequesters[0]) {
        return new TradeBehavior(
          ClientAPI.playerAgent.tradeRequesters[0],
          CrimeLeader.defaultTransition
        );
      } else if (
        CrimeLeader.instance.hasQuestToAssign() &&
        CrimeLeader.isValidQuestingAgent(other)
      ) {
        return CrimeLeader.instance.giveQuestBehavior(
          Helper.getOthersInConversation()[0]
        );
      }
    }
    return this;
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

  public static giveQuestTransition(this: GiveQuestBehavior) {
    if (this.currentActionState instanceof SuccessAction) {
      console.log(
        ClientAPI.playerAgent + " assigned a quest to " + this._targetAgent
      );
      CrimeLeader.instance._assignedAgents.add(this._targetAgent);
      return new IdleAndConverseBehavior(
        CrimeLeader.idleConverseTransition,
        CrimeLeader.idleConverseRequirement
      );
    } else if (this.currentActionState instanceof FailureAction) {
      for (const agent of Helper.getOthersInRoom()) {
        if (CrimeLeader.isValidQuestingAgent(agent)) {
          return new GiveQuestBehavior(
            agent,
            this._task,
            this._isQuestion,
            this._toTell,
            CrimeLeader.giveQuestTransition
          );
        }
      }
    }
    return this;
  }
}
