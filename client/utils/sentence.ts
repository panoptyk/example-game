import { Info, Agent, ClientAPI } from "panoptyk-engine/dist/client";
/**
 * class that helps generate usable sentences from Info and other models
 */
class Sentence {
  public static blockTest(): Sentence.Block[] {
    const block = {
      type: Sentence.BlockType.AGENT,
      text: "Bill ",
      next: {
        type: Sentence.BlockType.ACTION,
        text: "moved to ",
        next: {
          type: Sentence.BlockType.ROOM,
          text: "room7"
        }
      }
    };
    return Sentence.blockToArray(block);
  }
  public static fromInfo(info: Info): Sentence.Block[] {
    let blocks: Sentence.Block[] = undefined;
    if (info.isQuery()) {
      blocks = Sentence.createQuestion(info);
    } else if (info.isCommand()) {
      blocks = Sentence.createCommand(info);
    } else if (info.isMasked()) {
      blocks = Sentence.createMaskedFact(info);
    } else {
      blocks = Sentence.createFact(info);
    }
    return blocks;
  }
  private static createQuestion(info: Info): Sentence.Block[] {
    const terms = Sentence.questionReplace(info.getTerms());
    return Sentence.badCreate(terms, true);
  }
  private static createCommand(info: Info): Sentence.Block[] {
    const terms = Sentence.replaceMissing(info.getTerms(), "???");
    return Sentence.badCreate(terms);
  }
  private static createMaskedFact(info: Info): Sentence.Block[] {
    const terms = Sentence.replaceMissing(info.getTerms(), "____");
    return Sentence.badCreate(terms);
  }
  private static createFact(info: Info): Sentence.Block[] {
    const terms = info.getTerms();
    return Sentence.badCreate(terms);
  }

  /**
   * Replaces undefined terms with provided string
   *  @return new terms object
   */
  private static replaceMissing(infoTerms, fill = "???") {
    const dummyInfo = {
      agents: [],
      items: [],
      locations: [],
      quantities: [],
      factions: []
    };
    const terms = infoTerms.action
      ? Info.ACTIONS[infoTerms.action].getTerms(dummyInfo)
      : Info.PREDICATE.TAL.getTerms(dummyInfo as any);
    if (!terms.action) {
      terms.action = fill;
    }
    Object.keys(terms).forEach(k => {
      if (!infoTerms[k]) {
        const val = k.replace(/\d/, "");
        switch (val) {
          case "agent":
            terms[k] = { agentName: fill };
            break;
          case "loc":
            terms[k] = { roomName: fill };
            break;
          case "item":
            terms[k] = { itemName: fill };
            break;
          case "info":
            terms[k] = { id: fill };
            break;
          case "faction":
            terms[k] = { factionName: fill };
            break;
          default:
            break;
        }
      } else {
        terms[k] = infoTerms[k];
      }
    });
    return terms;
  }

  /**
   * Replaces undefined terms with provided string
   *  @return new terms object
   */
  private static questionReplace(infoTerms) {
    const dummyInfo = {
      agents: [],
      items: [],
      locations: [],
      quantities: [],
      factions: []
    };
    const terms = infoTerms.action
      ? Info.ACTIONS[infoTerms.action].getTerms(dummyInfo)
      : Info.PREDICATE[infoTerms.predicate].getTerms(dummyInfo as any);
    if (!terms.action) {
      terms.action = "did what";
    }
    Object.keys(terms).forEach(k => {
      if (!infoTerms[k]) {
        switch (k) {
          case "agent":
          case "agent1":
            terms[k] = { agentName: "Who" };
            break;
          case "agent2":
            terms[k] = { agentName: "whom" };
            break;
          case "loc":
            terms[k] = { roomName: "where" };
            break;
          case "item":
            terms[k] = { itemName: "what" };
            break;
          case "info":
            terms[k] = { id: "what" };
            break;
          case "faction":
            terms[k] = { factionName: "which faction" };
            break;
          default:
            break;
        }
      } else {
        terms[k] = infoTerms[k];
      }
    });
    return terms;
  }

  /**
   * This is a really bad way to make these sentences...
   */
  private static badCreate(terms, query = false): Sentence.Block[] {
    const arr = [];
    let agentName = terms.agent
      ? terms.agent.agentName
      : terms.agent1
      ? terms.agent1.agentName
      : "";
    if (agentName === ClientAPI.playerAgent.agentName) agentName = "You";
    if (
      terms.agent2 &&
      terms.agent2.agentName === ClientAPI.playerAgent.agentName
    ) {
      terms.agent2 = { agentName: "You" };
    }
    arr.push({
      type: Sentence.BlockType.AGENT,
      text: agentName + " "
    });
    switch (terms.action) {
      case Info.ACTIONS.ASK.name:
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "asked "
        });
        arr.push({
          type: Sentence.BlockType.INFO,
          text: "Question#" + terms.info.id + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "to "
        });
        arr.push({
          type: Sentence.BlockType.AGENT,
          text: terms.agent2.agentName + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "at "
        });
        arr.push({
          type: Sentence.BlockType.ROOM,
          text: terms.loc.roomName + " "
        });
        break;
      case Info.ACTIONS.CONVERSE.name:
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "conversed "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "with "
        });
        arr.push({
          type: Sentence.BlockType.AGENT,
          text: terms.agent2.agentName + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "at "
        });
        arr.push({
          type: Sentence.BlockType.ROOM,
          text: terms.loc.roomName + " "
        });
        break;
      case Info.ACTIONS.DROP.name:
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "dropped "
        });
        arr.push({
          type: Sentence.BlockType.ITEM,
          text: terms.item.itemName.itemName + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "at "
        });
        arr.push({
          type: Sentence.BlockType.ROOM,
          text: terms.loc.roomName + " "
        });
        break;
      case Info.ACTIONS.GAVE.name:
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "gave "
        });
        arr.push({
          type: Sentence.BlockType.ITEM,
          text: terms.item.itemName + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "to "
        });
        arr.push({
          type: Sentence.BlockType.AGENT,
          text: terms.agent2.agentName + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "at "
        });
        arr.push({
          type: Sentence.BlockType.ROOM,
          text: terms.loc.roomName + " "
        });
        break;
      case Info.ACTIONS.GREET.name:
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "greeted "
        });
        arr.push({
          type: Sentence.BlockType.AGENT,
          text: terms.agent2.agentName + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "at "
        });
        arr.push({
          type: Sentence.BlockType.ROOM,
          text: terms.loc.roomName + " "
        });
        break;
      case Info.ACTIONS.KNOW.name:
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "knows "
        });
        arr.push({
          type: Sentence.BlockType.INFO,
          text: "Info#" + terms.info.id + " "
        });
        break;
      case Info.ACTIONS.MOVE.name:
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "moved "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "to "
        });
        arr.push({
          type: Sentence.BlockType.ROOM,
          text: terms.loc1.roomName + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "from "
        });
        arr.push({
          type: Sentence.BlockType.ROOM,
          text: terms.loc2.roomName + " "
        });
        break;
      case Info.ACTIONS.PICKUP.name:
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "picked up "
        });
        arr.push({
          type: Sentence.BlockType.ITEM,
          text: terms.item.itemName + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "at "
        });
        arr.push({
          type: Sentence.BlockType.ROOM,
          text: terms.loc.roomName + " "
        });
        break;
      case Info.ACTIONS.TOLD.name:
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "told "
        });
        arr.push({
          type: Sentence.BlockType.INFO,
          text: "Info#" + terms.info.id + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "to "
        });
        arr.push({
          type: Sentence.BlockType.AGENT,
          text: terms.agent2.agentName + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "at "
        });
        arr.push({
          type: Sentence.BlockType.ROOM,
          text: terms.loc.roomName + " "
        });
        break;
      case Info.ACTIONS.QUEST.name:
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "assigned "
        });
        arr.push({
          type: Sentence.BlockType.QUEST,
          text: "quest#" + terms.quest.id + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "to "
        });
        arr.push({
          type: Sentence.BlockType.AGENT,
          text: terms.agent2.agentName + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "at "
        });
        arr.push({
          type: Sentence.BlockType.ROOM,
          text: terms.loc.roomName + " "
        });
        break;
      case Info.ACTIONS.QUEST_COMPLETE.name:
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "acknowledged "
        });
        arr.push({
          type: Sentence.BlockType.QUEST,
          text: "quest#" + terms.quest.id + " "
        });
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "was completed by "
        });
        arr.push({
          type: Sentence.BlockType.AGENT,
          text: terms.agent2.agentName + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "at "
        });
        arr.push({
          type: Sentence.BlockType.ROOM,
          text: terms.loc.roomName + " "
        });
        break;
      case Info.ACTIONS.QUEST_FAILED.name:
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "noted that a quest "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "regarding "
        });
        arr.push({
          type: Sentence.BlockType.INFO,
          text: "info#" + terms.info.id + " "
        });
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "was failed by "
        });
        arr.push({
          type: Sentence.BlockType.AGENT,
          text: terms.agent2.agentName + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "at "
        });
        arr.push({
          type: Sentence.BlockType.ROOM,
          text: terms.loc.roomName + " "
        });
        break;
      case Info.ACTIONS.POSSESS.name:
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "claimed to have possession of "
        });
        arr.push({
          type: Sentence.BlockType.ITEM,
          text: terms.item.itemName + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "at "
        });
        arr.push({
          type: Sentence.BlockType.ROOM,
          text: terms.loc.roomName + " "
        });
        break;
      case Info.ACTIONS.LOCATED_IN.name:
        arr.push({
          type: Sentence.BlockType.ITEM,
          text: terms.item.itemName + " "
        });
        arr.push({
          type: Sentence.BlockType.NONE,
          text: " present at "
        });
        arr.push({
          type: Sentence.BlockType.ROOM,
          text: terms.loc.roomName + " "
        });
        break;
      case "did what":
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "did what "
        });
        break;
      default:
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "!MISSING SWITCH CASE! "
        });
        break;
    }
    if (terms.time) {
      const date = new Date(terms.time);
      arr.push({
        type: Sentence.BlockType.NONE,
        text: "on "
      });
      arr.push({
        type: Sentence.BlockType.TIME,
        text:
          date.getMonth() +
          "-" +
          date.getDate() +
          "-" +
          (date.getFullYear() - 1900) +
          " " +
          date.getHours() +
          ":" +
          date.getMinutes() +
          "."
      });
    } else if (query) {
      arr.push({
        type: Sentence.BlockType.TIME,
        text: "when?"
      });
    } else {
      arr.push({
        type: Sentence.BlockType.NONE,
        text: "on "
      });
      arr.push({
        type: Sentence.BlockType.TIME,
        text: "???."
      });
    }
    return arr;
  }
  private static blockToArray(block: Sentence.Block) {
    const arr = [];
    let temp = block;
    while (temp) {
      arr.push(temp);
      temp = temp.next;
    }
    return arr;
  }
}
namespace Sentence {
  export enum BlockType {
    NONE = "none",
    TIME = "time",
    AGENT = "agent",
    ACTION = "action",
    ITEM = "item",
    ROOM = "room",
    INFO = "info",
    QUEST = "quest",
    FACTION = "faction"
  }
  export interface Block {
    prev?: Block;
    next?: Block;
    type: BlockType;
    text: string;
  }
}

export default Sentence;
