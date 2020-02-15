import { ActionState, KnowledgeBase } from "../../../lib";
import { ClientAPI, Room } from "panoptyk-engine/dist/client";

export class ExploreRoomAction extends ActionState {
  private explored = false;

  public get isExplored() {
    return this.explored;
  }

  constructor(nextState: () => ActionState) {
    super(nextState);
  }

  public act() {
    const room: Room = ClientAPI.playerAgent.room;
    const adjacentRooms: Room[] = room.getAdjacentRooms();
    KnowledgeBase.instance.roomMap.addRoom (room);
    adjacentRooms.forEach(neighbor => {
      KnowledgeBase.instance.roomMap.addRoom (neighbor);
      KnowledgeBase.instance.roomMap.addConnection (room, neighbor);
    });
    this.explored = true;
  }

  public nextState(): ActionState {
    return undefined;
  }
}
