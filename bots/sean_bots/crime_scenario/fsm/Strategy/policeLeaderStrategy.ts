import {
  ActionState,
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior,
  Strategy
} from "../../../../lib";
import { ClientAPI, Agent, Info, Quest } from "panoptyk-engine/dist/";
import * as Helper from "../../../../utils/helper";
import {
  IdleState,
  TellInfo,
  TurnInBehavior,
  GiveQuestBehavior
} from "../../../../utils";
import { PolicePatrol } from "../BehaviorStates/policePatrolBState";
import { ArrestBehavior } from "../BehaviorStates/arrestBState";
import { PoliceNavigateToAgent } from "../BehaviorStates/policeNavigateAgentBState";
import { PoliceKnowledgeBase } from "../KnowledgeBase/policeKnowledge";
import { IdleAndConverseBehavior } from "../../../../utils/BehaviorStates/idleAndConverseBState";

export class PoliceLeader extends Strategy {
  targetedCriminals: Set<Agent> = new Set<Agent>();
  _nextTarget: Agent;
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

  static hasActiveGivenQuest(agent: Agent): boolean {
    for (const quest of ClientAPI.playerAgent.activeGivenQuests) {
      if (quest.receiver === agent) {
        return true;
      }
    }
    return false;
  }

  private updateNextTarget() {
    if (!this._nextTarget) {
      for (const agent of PoliceKnowledgeBase.instance.criminals) {
        if (
          !this.targetedCriminals.has(agent) &&
          !agent.agentStatus.has("dead")
        ) {
          this._nextTarget = agent;
        }
      }
    }
  }

  onGiveQuestSuccess() {
    if (this._nextTarget) {
      this.targetedCriminals.add(this._nextTarget);
      this._nextTarget = undefined;
    }
  }

  public async act() {
    PoliceLeader._activeInstance = this;
    PoliceKnowledgeBase.instance.detectCrime();
    this.updateNextTarget();
    this.currentBehavior = await this.currentBehavior.tick();
  }

  public getNextBehavior(): BehaviorState {
    if (this._nextTarget) {
      for (const agent of Helper.getOthersInRoom()) {
        if (
          agent.faction === ClientAPI.playerAgent.faction &&
          !PoliceLeader.hasActiveGivenQuest(agent)
        ) {
          const command = Info.ACTIONS.ARRESTED.question({
            agent1: agent,
            agent2: this._nextTarget,
            time: undefined,
            loc: undefined
          });
          const relatedInfo = ClientAPI.playerAgent.getInfoByAgent(
            this._nextTarget
          );
          return new GiveQuestBehavior(
            agent,
            command,
            false,
            relatedInfo,
            PoliceLeader.giveQuestTransition
          );
        }
      }
    }
    // idle if we have no target or agents to perform arrests
    return IdleAndConverseBehavior.activeInstance
      ? IdleAndConverseBehavior.activeInstance
      : new IdleAndConverseBehavior(PoliceLeader.idleConverseTransition);
  }

  public static idleConverseTransition(
    this: IdleAndConverseBehavior
  ): BehaviorState {
    return PoliceLeader.activeInstance.getNextBehavior();
  }

  public static giveQuestTransition(this: GiveQuestBehavior): BehaviorState {
    if (this.currentActionState instanceof SuccessAction) {
      PoliceLeader.activeInstance.onGiveQuestSuccess();
      return PoliceLeader.activeInstance.getNextBehavior();
    } else if (this.currentActionState instanceof FailureAction) {
      return PoliceLeader.activeInstance.getNextBehavior();
    }
    return this;
  }
}
