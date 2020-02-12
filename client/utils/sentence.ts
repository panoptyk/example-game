import { Info, Agent } from "panoptyk-engine/dist/client";
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
      blocks = Sentence.blockToArray(Sentence.createQuestion(info));
    } else {
      blocks = Sentence.createFact(info);
    }
    return blocks;
  }
  private static createQuestion(info: Info): Sentence.Block {
    return undefined;
  }
  private static createFact(info: Info): Sentence.Block[] {
    const terms = info.getTerms();
    return Sentence.badCreate(terms);
  }
  /**
   * This is a really bad way to make these sentences...
   */
  private static badCreate(terms): Sentence.Block[] {
    const arr = [];
    const agentName = terms.agent
      ? terms.agent.agentName
      : terms.agent1.agentName;
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
          text: "info#" + terms.info.id + " "
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
          text: terms.item + " "
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
          text: terms.item + " "
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
          type: Sentence.BlockType.NONE,
          text: "<incomplete> "
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
          type: Sentence.BlockType.NONE,
          text: "<incomplete> "
        });
        break;
      case Info.ACTIONS.TOLD.name:
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "told "
        });
        arr.push({
          type: Sentence.BlockType.INFO,
          text: "info#" + terms.info.id + " "
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
          text: "assigned a quest "
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
          type: Sentence.BlockType.ACTION,
          text: "completed a quest "
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
      case Info.ACTIONS.QUEST_FAILED.name:
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "failed a quest "
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
      case "???":
        arr.push({
          type: Sentence.BlockType.ACTION,
          text: "??? "
        });
        break;
      default:
        arr.push({
          type: Sentence.BlockType.NONE,
          text: "!MISSING SWITCH CASE! "
        });
        break;
    }
    arr.push({
      type: Sentence.BlockType.NONE,
      text: "on "
    });
    if (terms.time) {
      const date = new Date(Date.UTC(0, 0, 0, terms.time));
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
          ":00."
      });
    } else {
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
