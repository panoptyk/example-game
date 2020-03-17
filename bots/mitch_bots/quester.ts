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
import * as KB from "./kb/KBadditions";
import { log } from "./util/log";
import { BehaviorState, SuccessBehavior } from "../lib";
import { MoveToRoomBehavior } from "./behavior/moveToRoomBState";

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
        console.log(err);
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

// Set up listeners for KnowledgeBase //
let _updatingKB = false;
const roomsAdded = new Set();
ClientAPI.addOnUpdateListener(updates => {
  _updatingKB = true;
  // silent fail
  try {
    const curRoom = ClientAPI.playerAgent.room;
    KB.get.previousRoom = curRoom ? curRoom : KB.get.previousRoom;
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
  } catch (err) {
    // ignore all errors
  }
  _updatingKB = false;
});

// ================================== //

let state: BehaviorState = SuccessBehavior.instance;

async function act() {
  if (_updatingKB) {
    return;
  }
  const rooms = KB.roomMap.checkForUnexploredRooms();
  if (rooms.length && state === SuccessBehavior.instance) {
    const pick = Math.floor(Math.random() * rooms.length);
    state = new MoveToRoomBehavior(rooms[pick]);
  }
  state = await state.tick();
}

// =======Start Bot========== //
/*       */ init(); /*        */
// ========================== //
