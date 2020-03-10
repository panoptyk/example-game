import app from "./app";
import { Server, Room, Item, Controller } from "panoptyk-engine";
import { Spawner } from "./spawner";

const PanoptykServer = new Server(app);

PanoptykServer.start();

const spawnData: { roomID; itemID; max; rate }[] = [
  {
    roomID: 1,
    itemID: 1,
    max: 2,
    rate: 1
  }
];

const spawner = new Spawner();
spawnData.forEach(data => {
  spawner.addNewSpawn(
    Room.getByID(data.roomID),
    Item.getByID(data.itemID),
    data.max,
    data.rate
  );
});

const spawnItems = function() {
  spawner.checkSpawns(150);
  // tslint:disable-next-line: ban
  setTimeout(spawnItems, 150);
};
spawnItems();
