import { Room, ClientAPI } from "panoptyk-engine/dist/client";

export class RoomMap {
  // Singleton Patten
  private static _instance: RoomMap;

  public static get instance(): RoomMap {
    if (!RoomMap._instance) {
      RoomMap._instance = new RoomMap();
    }
    return RoomMap._instance;
  }

  private nodes: Room[] = [];
  private edges: Map<Room, Room> = new Map<Room, Room> ();

  public addRoom(room: Room): void {
    this.nodes.push (room);
  }

  public addConnection (room1: Room, room2: Room): void {
    if (!this.nodes.includes (room1) || !this.nodes.includes (room2)) {
      return;
    }
    this.edges.set (room1, room2);
    this.edges.set (room2, room1);
  }

  public findDisconnectedGraphs (): Room[] {
    const startPoints: Room[] = [];
    const nodeCopy = Object.assign ([], this.nodes);
    let next: Room;

    for (let i = 0; nodeCopy.length > 0; i++) {
      startPoints.push (nodeCopy [0]);
      next = startPoints [i];
      do {
        const index = nodeCopy.indexOf (next);
        nodeCopy.splice (index, 1);
        next = this.edges.get (next);
      } while (next !== startPoints [i]);
    }

    return startPoints;
  }

}
