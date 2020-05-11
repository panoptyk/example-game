import { Room, Agent } from "panoptyk-engine/dist/client";
import KBget from "./KBget";

class KBagent {
  // Singleton pattern
  private static _instance: KBagent;
  public static get instance() {
    if (!KBagent._instance) {
      KBagent._instance = new KBagent();
    }
    return KBagent._instance;
  }

  _agentRoomMap: Map<number, Room> = new Map();
  factionLeader: Agent = undefined;

  updateAgentInfo(agent: Agent) {
    const fs = agent.factionStatus;
    if (KBget.factionStatus.factionName === fs.factionName && fs.lvl >= 15) {
      this.factionLeader = agent;
    }
    if (agent.room) {
      this._agentRoomMap.set(agent.id, agent.room);
    }
  }

  lastSeen(agent: Agent): Room {
    return agent ? this._agentRoomMap.get(agent.id) : undefined;
  }

  all(): Agent[] {
    const agents = [];
    this._agentRoomMap.forEach((val, key) => {
      const agent = Agent.getByID(key);
      if (agent.factionStatus.lvl < 15) {
        agents.push(agent);
      }
    });
    return agents;
  }
}

export default KBagent.instance;
export { KBagent };
