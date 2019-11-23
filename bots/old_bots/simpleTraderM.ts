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
} from "panoptyk-engine/dist/";

// Boilerplate agent code ================================================== START
const username = process.argv[2] ? process.argv[2] : "simpleTrader";
const password = process.argv[3] ? process.argv[3] : "password";
const address = process.argv[4] ? process.argv[4] : "http://localhost:8080";

function init() {
  console.log("Logging in as: " + username + " to server: " + address);
  logger.silence();
  address ? ClientAPI.init(address) : ClientAPI.init();
  // tslint:disable-next-line: ban
  setTimeout(actWrapper, 100);
}

let _acting = false;
let _loggedIn = false;
let _endBot = false;
const _actInterval = 100; // ms before act() is called again(possibly)
function actWrapper() {
  if (!_acting) {
    _acting = true;
    if (!_loggedIn) {
      ClientAPI.login(username, password)
        .then(res => {
          console.log("Logged in!");
          _loggedIn = true;
        })
        .finally(() => {
          _acting = false;
        });
    } else {
      act().finally(() => {
        _acting = false;
      });
    }
  }
  if (!_endBot) {
    // tslint:disable-next-line: ban
    setTimeout(actWrapper, _actInterval);
  }
}
// Boilerplate agent code ================================================== END
// set "_endBot" to true to exit the script cleanly

function player() {
  return ClientAPI.playerAgent;
}

async function switchRoom() {
  const adjacents = player().room.getAdjacentRooms();
  const rm = Math.floor(Math.random() * adjacents.length);
  await ClientAPI.moveToRoom(adjacents[rm]);
}

const SWITCH_ROOM_INTERVAL = 3; // seconds
let moving = true;
let lastSwitch = 0;
let switchWait = 0;

let stop = true;

// This function is called every 100ms if possible
//  if it has not completed it will not be called until it has
async function act() {
  if (moving && Date.now() - lastSwitch > switchWait) {
    await switchRoom();
    lastSwitch = Date.now();
    switchWait = (SWITCH_ROOM_INTERVAL + Math.random() * 3) * 1000;
    console.log("Moved to " + player().room);
  } else if (!stop && player().conversationRequesters.length > 0) {
    // Accept convo
    await ClientAPI.acceptConversation(player().conversationRequesters[0]).then(
      () => {
        console.log("Accepted convo!");
      }
    );
  }
}

init();
