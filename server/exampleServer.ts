import app from "./app";
import { Server, Room, Item, Controller } from "panoptyk-engine";
import { Spawner } from "./spawner";

const PanoptykServer = new Server(app);

PanoptykServer.start();

const rateReduc = 0.1;

const spawnData: { roomID; itemID; max; rate }[] = [
  {
    roomID: 5,
    itemID: 1,
    max: 1,
    rate: 1 * rateReduc
  },
  {
    roomID: 5,
    itemID: 2,
    max: 3,
    rate: 3 * rateReduc
  },
  {
    roomID: 11,
    itemID: 3,
    max: 2,
    rate: 3 * rateReduc
  },
  {
    roomID: 10,
    itemID: 4,
    max: 2,
    rate: 1 * rateReduc
  },
  {
    roomID: 9,
    itemID: 5,
    max: 1,
    rate: 1 * rateReduc
  },
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
