import { Room, Item } from "panoptyk-engine/dist/client";

class KBitem {
  // Singleton pattern
  private static _instance: KBitem;
  public static get instance() {
    if (!KBitem._instance) {
      KBitem._instance = new KBitem();
    }
    return KBitem._instance;
  }

  _itemRoomMap: Map<number, Room> = new Map();
  _masterItems: Set<number> = new Set();
  get masterItems(): Item[] {
    return Item.getByIDs([...this._masterItems]);
  }

  updateItemInfo(item: Item) {
    this._masterItems.add(item.master.id);
    this._itemRoomMap.set(item.master.id, item.room);
  }

  lastSeen(item: Item): Room {
    return this._itemRoomMap.get(item.master.id);
  }
}

export default KBitem.instance;
export { KBitem };
