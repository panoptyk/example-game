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
import { PoliceLeader } from "./fsm/Strategy/policeLeaderStrategy";

// Boilerplate agent code ================================================== START
const username = process.argv[2] ? process.argv[2] : "idle";
const password = process.argv[3] ? process.argv[3] : "password";
const address = process.argv[4] ? process.argv[4] : "http://localhost:8080";

const MAX_RETRY = 10;
const RETRY_INTERVAL = 100; // ms before attempLogin() is called again to retry logging in
const ACT_INTERVAL = 100; // ms before act() is called again(possibly)

function init() {
  console.log("Logging in as: " + username + " to server: " + address);
  // logger.silence();
  address ? ClientAPI.init(address) : ClientAPI.init();
  attemptLogin();
}

let _retries = 1;
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
      policeLeader = new PoliceLeader();
      console.log("Logged in!");
      // tslint:disable-next-line: ban
      setTimeout(actWrapper, 100);
    });
}

let _acting = false;
let _endBot = false;
function actWrapper() {
  if (!_acting) {
    _acting = true;
    act()
      .catch(err => {
        if (ClientAPI.playerAgent.agentStatus.has("dead")) _endBot = true;
        else console.log(err);
      })
      .finally(() => {
        _acting = false;
      });
  }
  if (!_endBot) {
    // tslint:disable-next-line: ban
    setTimeout(actWrapper, ACT_INTERVAL);
  }
}

let policeLeader: PoliceLeader;

async function act() {
  await policeLeader.act();
}

// =======Start Bot========== //
/*       */ init(); /*        */
// ========================== //
