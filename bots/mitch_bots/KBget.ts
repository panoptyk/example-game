import { Agent, ClientAPI } from "panoptyk-engine/dist/client";

class KBget {
  // Singleton pattern
  private static _instance: KBget;
  public static get instance() {
    if (!KBget._instance) {
      KBget._instance = new KBget();
    }
    return KBget._instance;
  }

  constructor() {}

  public questGivenToAgent(agent: Agent): number {
    const player = ClientAPI.playerAgent;
    if (!player || !agent) {
      return 0;
    }
    let tally = 0;
    agent.activeAssignedQuests.forEach(q => {
      if (q.giver.id === player.id) {
        tally++;
      }
    });
    return tally;
  }

  public otherAgentInConvo(): Agent {
    return ClientAPI.playerAgent.conversation.getAgents(
      ClientAPI.playerAgent
    )[0];
  }
}

export default KBget.instance;
export { KBget };
