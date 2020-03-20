import {
  Agent,
  ClientAPI,
  Room,
  Quest,
  IDObject,
  Item,
  Info
} from "panoptyk-engine/dist/client";
import { FactionStatus } from "panoptyk-engine/dist/models/faction";

class KBget {
  // Singleton pattern
  private static _instance: KBget;
  public static get instance() {
    if (!KBget._instance) {
      KBget._instance = new KBget();
    }
    return KBget._instance;
  }

  previousRoom: Room;

  constructor() {}

  get player(): Agent {
    return ClientAPI.playerAgent;
  }

  get curRoom(): Room {
    return ClientAPI.playerAgent ? ClientAPI.playerAgent.room : undefined;
  }

  get inventory(): Item[] {
    return this.player ? this.player.inventory : [];
  }

  get knowledge(): Info[] {
    return this.player ? this.player.knowledge : [];
  }

  get factionStatus(): FactionStatus {
    return ClientAPI.playerAgent.factionStatus;
  }

  get myLvl(): number {
    return this.factionStatus.lvl;
  }

  get activeQuests(): Quest[] {
    return ClientAPI.playerAgent.activeAssignedQuests;
  }

  numberOwned(item: Item) {
    let tally = 0;
    this.inventory.forEach(i => {
      if (item.sameAs(i)) {
        tally++;
      }
    });
    return tally;
  }

  questGivenToAgent(agent: Agent): number {
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

  otherAgentInConvo(): Agent {
    const c = ClientAPI.playerAgent.conversation;
    return c ? c.getAgents(ClientAPI.playerAgent)[0] : undefined;
  }

  otherAgentInTrade(): Agent {
    const t = ClientAPI.playerAgent.trade;
    return t ? t.getAgents(ClientAPI.playerAgent)[0] : undefined;
  }

  questTurnIns(quest: Quest): IDObject[] {
    if (quest.receiver.id !== this.player.id) {
      return [];
    }
    if (quest.type === "item") {
      const items = [];
      this.inventory.forEach(item => {
        if (quest.item.sameAs(item) && items.length < quest.amount) {
          items.push(item);
        }
      });
      return items;
    } else {
      const info = [];
      this.knowledge.forEach(i => {
        if (i.isAnswer(quest.task) && info.length < quest.amount) {
          info.push(i);
        }
      });
      return info;
    }
  }

  completableQuests(): Quest[] {
    const quests: Quest[] = [];
    this.player.activeAssignedQuests.forEach(q => {
      if (this.questTurnIns(q).length === q.amount) {
        quests.push(q);
      }
    });
    return quests;
  }

  questNeeds(): {
    items: { item: Item; amount: number }[];
    tasks: { info: Info; amount: number }[];
  } {
    const needs: {
      items: { item: Item; amount: number }[];
      tasks: { info: Info; amount: number }[];
    } = { items: [], tasks: [] };
    this.activeQuests.forEach(q => {
      if (q.type === "item") {
        needs.items.push({ item: q.item, amount: q.amount });
      } else {
        needs.tasks.push({ info: q.task, amount: q.amount });
      }
    });
    return needs;
  }
}

export default KBget.instance;
export { KBget };
