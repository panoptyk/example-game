import * as Server from "panoptyk-engine";
import * as util from "panoptyk-engine";

const ITEMS_PER_ROOM = 10;
let itemNum = 1;
Server.Room.loadAll();
for (const key in Server.Room.objects) {
  const room: Server.Room = Server.Room.objects[key];
  for (let i = 0; i < ITEMS_PER_ROOM; i++) {
    const item = new Server.Item("Item " + itemNum++);
    item.putInRoom(room);
    room.addItem(item);
    if (Math.random() < 0.5) {
      item.addItemTag("illegal");
    }
  }
}
Server.Room.saveAll();
Server.Item.saveAll();