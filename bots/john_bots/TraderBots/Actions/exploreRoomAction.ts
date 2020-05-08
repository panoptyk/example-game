import { ActionState } from "../../../lib";
import { ClientAPI, Room } from "panoptyk-engine/dist/client";
import roomMap from "../../../lib/KnowledgeBase/RoomMap";

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
    roomMap.addRoom (room);
    console.log("Explored room " + room);
    adjacentRooms.forEach(neighbor => {
      roomMap.addRoom (neighbor);
      roomMap.addConnection (room, neighbor);
    });
    this.explored = true;
  }

  public nextState(): ActionState {
    return undefined;
  }
}
