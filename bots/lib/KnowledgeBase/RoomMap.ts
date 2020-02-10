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

  private nodes: Set<Room> = new Set<Room> ();
  private edges: Map<Room, Room[]> = new Map<Room, Room[]> ();

  public addRoom(room: Room): void {
    this.nodes.add (room);
  }

  public addConnection (room1: Room, room2: Room): void {
    if (!this.nodes.has (room1) || !this.nodes.has (room2)) {
      return;
    }

    if (this.edges.has (room1)) {
      this.edges.get (room1).push (room2);
    } else{
      this.edges.set (room1, [room2]);
    }
  }

  public findDisconnectedGraphs (): Room[] {
    const startPoints: Set<Room> = new Set<Room> ();
    const visited: Set<Room> = new Set<Room> ();
    const toVisit: Set<Room> = new Set<Room> ();
    let setDifference = new Set([...this.nodes].filter (x => !visited.has(x)));

    while (visited.size < this.nodes.size) {
      const room: Room = setDifference.values [0];
      startPoints.add (room);
      toVisit.add (room);

      while (toVisit.size > 0) {
        const r: Room = toVisit.values [0];
        toVisit.delete (r);
        visited.add (r);
        this.edges.get(r).forEach(element => {
          if (!visited.has (element)) {
            toVisit.add (element);
          }
        });
      }

      setDifference = new Set([...this.nodes].filter (x => !visited.has(x)));
    }

    return Array.from (startPoints);
  }

}
