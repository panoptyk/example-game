import KBget from "./KBget";
import KBagent from "./KBagent";
import { QuestHelper } from "../util/questHelper";
import {
  Agent,
  ClientAPI,
  IDObject,
  Item,
  Info
} from "panoptyk-engine/dist/client";

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

  agentInRoom(agent: Agent) {
    return KBget.curRoom.hasAgent(agent);
  }

  convoRequestedWith(agent: Agent): boolean {
    return ClientAPI.playerAgent.activeConversationRequestTo(agent);
  }

  tradeRequestedWith(agent: Agent): boolean {
    return ClientAPI.playerAgent.activeTradeRequestTo(agent);
  }

  neededForQuest(model: IDObject) {
    const needs = KBget.questNeeds();
    if (model instanceof Item) {
      const tally = KBget.numberOwned(model);
      return needs.items.reduce((a, b) => {
        return a || (b.item.sameAs(model) && b.amount > tally);
      }, false);
    } else if (model instanceof Info) {
      return false;
    }
    return false;
  }

  itemInInventory(master: Item) {
    return KBget.inventory.reduce((a, b) => {
      return a || b.sameAs(master);
    }, false);
  }
}

export default KBis.instance;
export { KBis };
