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
import { IdleBehavior } from "./BehaviorStates/idleBState";
import { IdleState } from "./ActionStates/idleAState";
import { MoveState } from "./ActionStates/moveAState";
import { ActionState } from "./ActionStates/actionState";
import { State } from "./state";

// Boilerplate agent code ================================================== START
const username = process.argv[2] ? process.argv[2] : "idle";
const password = process.argv[3] ? process.argv[3] : "password";
const address = process.argv[4] ? process.argv[4] : "http://localhost:8080";

const MAX_RETRY = 10;
const RETRY_INTERVAL = 100; // ms before attempLogin() is called again to retry logging in
const ACT_INTERVAL = 100; // ms before act() is called again(possibly)

function init() {
  console.log("Logging in as: " + username + " to server: " + address);
  logger.silence();
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
        console.log(err);
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
// Boilerplate agent code ================================================== END
// set "_endBot" to true to exit the script cleanly

const newIdleTransition = function(this: IdleState): ActionState {
  if (Math.random() * 1000 < this.delay) {
    const adjacentRooms: Room[] = ClientAPI.playerAgent.room.getAdjacentRooms();
    return new MoveState(
      adjacentRooms[Math.floor(Math.random() * adjacentRooms.length)],
      function(this: MoveState): ActionState {
        if (this.successfullyMoved()) {
          return new IdleState(newIdleTransition);
        }
        else {
          return this;
        }
      }
    );
  } else {
    this.delay += this.deltaTime;
    return this;
  }
};
const idle = new IdleState(newIdleTransition);
let currentBehaviour: State = new IdleBehavior(idle);

async function act() {
  currentBehaviour = await currentBehaviour.tick();
}

// =======Start Bot========== //
/*       */ init(); /*        */
// ========================== //
