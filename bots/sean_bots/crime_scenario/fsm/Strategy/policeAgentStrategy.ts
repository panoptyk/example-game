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
import { IdleState, TellInfo, TurnInBehavior } from "../../../../utils";
import { PolicePatrol } from "../BehaviorStates/policePatrolBState";
import { ArrestBehavior } from "../BehaviorStates/arrestBState";
import { PoliceNavigateToAgent } from "../BehaviorStates/policeNavigateAgentBState";
import { PoliceKnowledgeBase } from "../KnowledgeBase/policeKnowledge";

export class PoliceAgent extends Strategy {
  private static _activeInstance: PoliceAgent;
  public static get activeInstance(): PoliceAgent {
    return this._activeInstance;
  }

  constructor() {
    super();
    this.currentBehavior = new PolicePatrol(
      Helper.WAIT_FOR_OTHER,
      PoliceAgent.patrolTransition
    );
  }

  public async act() {
    PoliceAgent._activeInstance = this;
    PoliceKnowledgeBase.instance.detectCrime();
    this.currentBehavior = await this.currentBehavior.tick();
  }

  public static patrolTransition(this: PolicePatrol): BehaviorState {
    for (const quest of ClientAPI.playerAgent.activeAssignedQuests) {
      if (
        quest.giver.faction === ClientAPI.playerAgent.faction &&
        quest.task.action === "ARRESTED"
      ) {
        const target = quest.task.getTerms().agent2;
        if (ClientAPI.playerAgent.room.hasAgent(target)) {
          return new ArrestBehavior(
            target,
            quest,
            PoliceAgent.arrestTransition
          );
        }
      }
    }
    for (const agent of Helper.getOthersInRoom()) {
      if (
        agent.faction === ClientAPI.playerAgent.faction &&
        !agent.conversation &&
        !PolicePatrol.activeInstance.conversedAgents.has(agent)
      ) {
        if (
          Helper.hasToldInfo(
            agent,
            Array.from(PoliceKnowledgeBase.instance.allCrimes)
          )
        ) {
          PolicePatrol.activeInstance.conversedAgents.add(agent);
        } else {
          const toTell = new Set(PoliceKnowledgeBase.instance.allCrimes);
          for (const info of ClientAPI.playerAgent.getInfoByAction("TOLD")) {
            const terms = info.getTerms();
            if (terms.agent2 === agent && toTell.has(info)) {
              toTell.delete(info);
            }
          }
          return new TellInfo(
            agent,
            Array.from(toTell),
            PoliceAgent.tellTransition
          );
        }
      }
    }
    return this;
  }

  public static turnInTransition(this: TurnInBehavior) {
    if (this.currentActionState instanceof SuccessAction) {
      console.log(ClientAPI.playerAgent + " completed quest " + this.quest);
      return new PolicePatrol(
        Helper.WAIT_FOR_OTHER,
        PoliceAgent.patrolTransition
      );
    } else if (!ClientAPI.playerAgent.room.hasAgent(this.quest.giver)) {
      return new PoliceNavigateToAgent(this.quest.giver, Infinity, function(
        this: PoliceNavigateToAgent
      ) {
        if (this.currentActionState instanceof SuccessAction) {
          return TurnInBehavior.activeInstance;
        }
        return this;
      });
    }
    return this;
  }

  public static arrestTransition(this: ArrestBehavior): BehaviorState {
    if (this.currentActionState instanceof SuccessAction) {
      console.log(ClientAPI.playerAgent + " arrested " + this._targetAgent);
      return new TurnInBehavior(this._warrant, PoliceAgent.turnInTransition);
    } else if (this.currentActionState instanceof IdleState) {
      return new PolicePatrol(
        Helper.WAIT_FOR_OTHER,
        PoliceAgent.patrolTransition
      );
    }
    return this;
  }

  public static tellTransition(this: TellInfo): BehaviorState {
    if (
      this.currentActionState instanceof FailureAction ||
      this.currentActionState instanceof SuccessAction
    ) {
      PolicePatrol.activeInstance.conversedAgents.add(this._targetAgent);
      return new PolicePatrol(
        Helper.WAIT_FOR_OTHER,
        PoliceAgent.patrolTransition
      );
    }
    return this;
  }
}
