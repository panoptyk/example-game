import app from "./app";
import { Server, Agent, Room, Item, Controller } from "panoptyk-engine";
import { Spawner } from "./spawner";

const PanoptykServer = new Server(app);

PanoptykServer.start();

const rateReduc = 0.015;

const spawnData: { roomID; itemID; max; rate }[] = [
  {
    roomID: 5,
    itemID: 1,
    max: 1,
    rate: 1 * rateReduc
  },
  {
    roomID: 14,
    itemID: 6,
    max: 1,
    rate: 1 * rateReduc
  },
  {
    roomID: 6,
    itemID: 7,
    max: 1,
    rate: 1 * rateReduc
  },
  {
    roomID: 7,
    itemID: 8,
    max: 1,
    rate: 1 * rateReduc
  },
  {
    roomID: 5,
    itemID: 2,
    max: 2,
    rate: 3 * rateReduc
  },
  {
    roomID: 11,
    itemID: 3,
    max: 2,
    rate: 4 * rateReduc
  },
  {
    roomID: 10,
    itemID: 4,
    max: 2,
    rate: 3 * rateReduc
  },
  {
    roomID: 9,
    itemID: 5,
    max: 2,
    rate: 4 * rateReduc
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

const agents = [
  "Alison",
  "Eldric",
  "Florence",
  "Holden",
  "Knox",
  "Paige",
  "Tuesday",
  "Wilfred"
];
const checkForAllAgents = function() {
  const allIn = agents.reduce((a, b) => {
    return a && Agent.getAgentByName(b).socket !== undefined;
  }, true);
  console.log("Checking all agents logged in... " + allIn);
  if (allIn) {
    agents.forEach(a => {
      Agent.getAgentByName(a).socket.emit("all-agents-in");
    });
    spawnItems();
  } else {
    // tslint:disable-next-line: ban
    setTimeout(checkForAllAgents, 1000);
  }
};

checkForAllAgents();
// spawnItems();
