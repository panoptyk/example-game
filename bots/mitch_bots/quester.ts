import {
  Agent,
  Room,
  Info,
  Trade,
  Item,
  Conversation,
  ClientAPI,
  getPanoptykDatetime,
  logger
} from "panoptyk-engine/dist/client";
import { log } from "./util/log";
import DELAYS from "./util/humanDelay";
import DECIDES from "./util/decision";
import * as KB from "./kb/KBadditions";
import { BehaviorState, SuccessBehavior } from "../lib";
import { PickUpItemBehavior } from "./behavior/pickUpItemBState";
import { QuestStrategy } from "./strategy/questStrat";
import { DiscussionStrategy } from "./strategy/discussStrat";

// Boilerplate agent code ================================================== START
const username = process.argv[2] ? process.argv[2] : "quester";
const password = process.argv[3] ? process.argv[3] : "password";
const address = process.argv[4] ? process.argv[4] : "http://localhost:8080";

const MAX_RETRY = 10;
const RETRY_INTERVAL = 100; // ms before attempLogin() is called again to retry logging in
const ACT_INTERVAL = 200; // ms before act() is called again(possibly)

function init() {
  console.log("Logging in as: " + username + "\nTo server: " + address);
  logger.silence();
  address ? ClientAPI.init(address) : ClientAPI.init();
  process.on("SIGINT", () => {
    if (!_loggedIn) {
      process.exit(0);
    } else {
      _endBot = true;
    }
  });
  attemptLogin();
}

let _retries = 1;
let _loggedIn = false;
function attemptLogin() {
  ClientAPI.login(username, password)
    .catch(res => {
      console.log("Failed(%d)....retrying...", _retries);
      if (_retries <= MAX_RETRY) {
        _retries++;
        // tslint:disable-next-line: ban
        setTimeout(attemptLogin, RETRY_INTERVAL);
      }
    })
    .then(res => {
      console.log("Logged in!");
      _loggedIn = true;
      // tslint:disable-next-line: ban
      setTimeout(actWrapper, 200);
    });
}

let _acting = false;
let _endBot = false;
function actWrapper() {
  if (!_acting) {
    _acting = true;
    act()
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        _acting = false;
      });
  }
  if (!_endBot) {
    // tslint:disable-next-line: ban
    setTimeout(actWrapper, ACT_INTERVAL);
  } else {
    console.log("bot exiting...");
    process.exit(0);
  }
}
// Boilerplate agent code ================================================== END
// set "_endBot" to true to exit the script cleanly

// Silence types of logging
// log.ignore.push(log.STATE);

// Set human delays
// DELAYS.setOverride(true);
DELAYS.setDelay("move-room", { avg: 3000, var: 2000 });
DELAYS.setDelay("pickup-item", { avg: 300, var: 200 });
DELAYS.setDelay("request-convo", { avg: 500, var: 200 });
DELAYS.setDelay("request-trade", { avg: 500, var: 200 });
DELAYS.setDelay("leave-convo-trade", { avg: 500, var: 200 });
DELAYS.setDelay("turn-in-quest", { avg: 300, var: 0 });

// Decision probabilities
DECIDES.set("pick-up-item", 0.1);

// Set up listeners for KnowledgeBase //
let _updatingKB = false;
let questNum = 0;
const roomsAdded = new Set();
ClientAPI.addOnUpdateListener(updates => {
  _updatingKB = true;
  // silent fail
  try {
    const curRoom = KB.get.curRoom;
    // update roomMap
    if (curRoom && !roomsAdded.has(curRoom)) {
      log("Adding " + curRoom + " to RoomMap", log.KB);
      roomsAdded.add(curRoom);
      KB.roomMap.addRoom(curRoom);
      curRoom.getAdjacentRooms().forEach(neighbor => {
        KB.roomMap.addRoom(neighbor);
        KB.roomMap.addConnection(curRoom, neighbor);
      });
    }
    // update where items located
    if (curRoom) {
      curRoom.getItems().forEach(item => {
        log(
          "Updating info on item " +
            item.master +
            " in room " +
            curRoom.roomName,
          log.KB
        );
        KB.item.updateItemInfo(item);
      });
    }
    updates.Agent.forEach(agent => {
      // update where agent last seen
      if (agent.id !== ClientAPI.playerAgent.id) {
        log("Updating info on agent " + agent.agentName, log.KB);
        KB.agent.updateAgentInfo(agent);
      }
    });
    // log new quest recieved
    const quests = ClientAPI.playerAgent.activeAssignedQuests;
    if (questNum < quests.length) {
      log("Recieved new quest!", log.KB);
    }
    questNum = quests.length;
  } catch (err) {
    // ignore all errors
  }
  _updatingKB = false;
});

// ================================== //
// Overall variables
const questStrat = new QuestStrategy();
let discussStrat: DiscussionStrategy = undefined;
let pickUpState: BehaviorState = undefined;

// for item pickup checks
let roomChecked: Room = { id: 0 } as Room;
let itemsSeen: Set<number> = new Set();

function itemToPickUp(): Item {
  if (roomChecked.id !== KB.get.curRoom.id) {
    roomChecked = KB.get.curRoom;
    itemsSeen = new Set();
  }
  const needs = KB.get.questNeeds();
  for (const i of KB.get.curRoom.getItems()) {
    const owned = KB.get.numberOwned(i);
    for (const needI of needs.items) {
      if (needI.item.sameAs(i) && needI.amount > owned) {
        return i;
      }
    }
    if (!itemsSeen.has(i.id) && DECIDES.decide("pick-up-item")) {
      return i;
    }
    itemsSeen.add(i.id);
  }
  return undefined;
}

async function act() {
  if (_updatingKB) {
    return;
  }
  // check to initiate new pickup of item
  const item = itemToPickUp();
  if (!pickUpState && item) {
    pickUpState = new PickUpItemBehavior(item, function(this: PickUpItemBehavior): BehaviorState {
      if (this._complete) {
        return SuccessBehavior.instance;
      } else {
        return this;
      }
    });
  }

  // tick higher priority state
  if (pickUpState) { // pick up an item
    pickUpState = await pickUpState.tick();
  } else if (discussStrat) { // handle discussion
    await discussStrat.act();
  } else {
    await questStrat.act();
  }

  // Clean up states
  if (pickUpState === SuccessBehavior.instance) {
    pickUpState = undefined;
  }
  if (discussStrat && discussStrat.complete) {
    discussStrat = undefined;
  }
}

// =======Start Bot========== //
/*       */ init(); /*        */
// ========================== //
