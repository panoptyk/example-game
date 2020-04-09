import { ClientAPI, Agent, Info, Item } from "panoptyk-engine/dist/";
import { RoomMap } from "../../../../lib";

export interface AgentReputation {
  score: number;
  memorableBad: Info[];
  memorableGood: Info[];
}

export class KnowledgeBase {
  private _updatingKB = false;
  public get updatingKB() {
    return this._updatingKB;
  }
  private roomsAdded = new Set();
  roomMap: RoomMap = RoomMap.instance;

  protected static _instance: KnowledgeBase;
  static get instance(): KnowledgeBase {
    if (!KnowledgeBase._instance) {
      KnowledgeBase._instance = new KnowledgeBase();
    }
    return KnowledgeBase._instance;
  }

  protected constructor() {
    // Set up listeners for KnowledgeBase //
    ClientAPI.addOnUpdateListener((updates) => {
      this._updatingKB = true;
      // silent fail
      try {
        const curRoom = ClientAPI.playerAgent.room;
        // update roomMap
        if (curRoom && !this.roomsAdded.has(curRoom)) {
          this.roomsAdded.add(curRoom);
          this.roomMap.addRoom(curRoom);
          curRoom.getAdjacentRooms().forEach((neighbor) => {
            this.roomMap.addRoom(neighbor);
            this.roomMap.addConnection(curRoom, neighbor);
          });
        }
      } catch (err) {
        // ignore all errors
      }
      this._updatingKB = false;
    });
  }

  static get factionLeader() {
    if (ClientAPI.playerAgent.faction) {
      for (const agent of ClientAPI.playerAgent.faction.members) {
        if (agent.factionRank >= 1000) {
          return agent;
        }
      }
    }
    return undefined;
  }

  public calcItemVal(item: Item) {
    let val: number;
    switch (item.type) {
      case "gold":
        val = item.quantity * 1;
        break;
      case "common":
        val = 5;
        break;
      case "rare":
        val = 10;
        break;
      case "legendary":
        val = 100;
        break;
      default:
        val = 1;
        break;
    }
    return val;
  }
}
