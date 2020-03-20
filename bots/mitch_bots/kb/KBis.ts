import KBget from "./KBget";
import KBagent from "./KBagent";
import { QuestHelper } from "../util/questHelper";
import { Agent, ClientAPI } from "panoptyk-engine/dist/client";

class KBis {
  // Singleton pattern
  private static _instance: KBis;
  public static get instance() {
    if (!KBis._instance) {
      KBis._instance = new KBis();
    }
    return KBis._instance;
  }

  constructor() {}

  newQuestAvailable(): boolean {
    return KBget.activeQuests.length < QuestHelper.getMaxQuests(KBget.myLvl);
  }

  factionLeaderInRoom(): boolean {
    return (
      KBagent.factionLeader &&
      KBagent.factionLeader.room &&
      KBagent.factionLeader.room.id === KBget.curRoom.id
    );
  }

  convoRequestedWith(agent: Agent): boolean {
    return ClientAPI.playerAgent.activeConversationRequestTo(agent);
  }

  tradeRequestedWith(agent: Agent): boolean {
    return ClientAPI.playerAgent.activeTradeRequestTo(agent);
  }
}

export default KBis.instance;
export { KBis };
