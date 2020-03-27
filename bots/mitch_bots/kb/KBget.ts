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
import KBagent from "./KBagent";

class KBget {
  // Singleton pattern
  private static _instance: KBget;
  public static get instance() {
    if (!KBget._instance) {
      KBget._instance = new KBget();
    }
    return KBget._instance;
  }

  _questionsAsked: Set<number> = new Set();
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

  get questionsAsked(): Set<number> {
    return this._questionsAsked;
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

  answerToQuestion(q: Info): Info {
    for (let i = this.knowledge.length - 1; i >= 0; i++) {
      const ans = this.knowledge[i];
      if (ans.isAnswer(q)) {
        return ans;
      }
    }
    return undefined;
  }

  otherAgentInConvo(): Agent {
    const c = ClientAPI.playerAgent.conversation;
    return c ? c.getAgents(ClientAPI.playerAgent)[0] : undefined;
  }

  questionsAskedByOtherInConvo(): Info[] {
    const info = [];
    const c = ClientAPI.playerAgent.conversation;
    if (c) {
      c.askedQuestions.forEach(i => {
        if (!this._questionsAsked.has(i.id)) {
          info.push(i);
        }
      });
    }
    return info;
  }

  otherAgentInTrade(): Agent {
    const t = ClientAPI.playerAgent.trade;
    return t ? t.getAgents(ClientAPI.playerAgent)[0] : undefined;
  }

  numberOfOffers(): number {
    const t = ClientAPI.playerAgent.trade;
    let offers = 0;
    if (t) {
      const player = this.player;
      offers += t.getAgentsOfferedItems(player).length;
      offers += t.getAnswersOffered(player).reduce((a, b) => {
        return a + b.quantity;
      }, 0);
    }
    return offers;
  }

  numberOfOffersByOtherAgent(): number {
    const t = ClientAPI.playerAgent.trade;
    let offers = 0;
    if (t) {
      const other = this.otherAgentInTrade();
      offers += t.getAgentsOfferedItems(other).length;
      offers += t.getAnswersOffered(other).reduce((a, b) => {
        return a + b.quantity;
      }, 0);
    }
    return offers;
  }

  requestsByOtherAgent(): { model: IDObject; pass: boolean }[] {
    const t = ClientAPI.playerAgent.trade;
    const requests: { model: IDObject; pass: boolean }[] = [];
    if (t) {
      const other = this.otherAgentInTrade();
      const answers = t.getAgentsRequestedAnswers(other);
      const items = t.getAgentsRequestedItems(other);
      answers.forEach((pass, model) => {
        requests.push({ model, pass });
      });
      items.forEach((pass, model) => {
        requests.push({ model, pass });
      });
    }
    return requests;
  }

  tradeRequests(): { model: IDObject; pass: boolean }[] {
    const t = ClientAPI.playerAgent.trade;
    const requests: { model: IDObject; pass: boolean }[] = [];
    if (t) {
      const player = this.player;
      const answers = t.getAgentsRequestedAnswers(player);
      const items = t.getAgentsRequestedItems(player);
      answers.forEach((pass, model) => {
        requests.push({ model, pass });
      });
      items.forEach((pass, model) => {
        requests.push({ model, pass });
      });
    }
    return requests;
  }

  questionToAsk(ignore?: Set<number>): any {
    // const otherQs = this.questionsAskedByOtherInConvo();
    const needs = this.questNeeds();
    if (needs.items.length > 0) {
      const pick = Math.floor(Math.random() * needs.items.length);
      return {
        action: "LOCATED_IN",
        item: { id: needs.items[pick].item.id }
      };
    } else if (needs.tasks.length > 0) {
      const pick = Math.floor(Math.random() * needs.tasks.length);
      return needs.tasks[pick].info;
    }
    return undefined;
  }

  agentsOfInterest(): Agent[] {
    let list = [];
    const agents: Set<number> = new Set();
    const needs = this.questNeeds();
    needs.tasks.forEach(task => {
      const terms = task.info.getTerms();
      if (terms.agent) {
        agents.add(terms.agent.id);
      }
    });
    list = Agent.getByIDs([...agents]);
    if (this.player.faction.factionName === "Informants") {
      list = KBagent.all().filter(agent => agent.faction.factionName === "Craftsmen");
    }
    return ;
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
