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

// stall out bots till all agents logged in
let _canBegin = false;

function init() {
  console.log("Logging in as: " + username + "\nTo server: " + address);
  logger.silence();
  address ? ClientAPI.init(address) : ClientAPI.init();
  // check to begin acting after all 8 agents logged in
  (ClientAPI as any).socket.on("all-agents-in", data => {
    log("Recieved message that all agents have logged in.", log.ACT);
    askForConvoTime = Date.now() + 15000;
    _canBegin = true;
  });
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
DELAYS.setDelay("decide-to-ask-convo", { avg: 25000, var: 3000 });
DELAYS.setDelay("move-room", { avg: 9000, var: 2500 });
DELAYS.setDelay("pickup-item", { avg: 1200, var: 200 });
DELAYS.setDelay("request-convo", { avg: 1000, var: 200 });
DELAYS.setDelay("convo-action", { avg: 1200, var: 500 });
DELAYS.setDelay("request-trade", { avg: 700, var: 200 });
DELAYS.setDelay("trade-action", { avg: 1200, var: 500 });
DELAYS.setDelay("leave-convo-trade", { avg: 500, var: 0 });
DELAYS.setDelay("turn-in-quest", { avg: 500, var: 0 });

// Decision probabilities
// DECIDES.setOverride(true);
DECIDES.set("pick-up-item", 0.25);
DECIDES.set("move-random", 0.75);
DECIDES.set("accept-convo", 0.75);
DECIDES.set("decide-convo-poi", 0.5);
DECIDES.set("decide-convo-random", 0.25);
DECIDES.set("accept-trade", 0.85);
DECIDES.set("trade-again", 0.6);
DECIDES.set("decide-trade-poi", 0.7);
DECIDES.set("decide-trade-random", 0.35);
DECIDES.set("pass-request", 0.45);
DECIDES.set("answer-question", 0.4);
DECIDES.set("ask-question", 0.7);

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
    // look at info
    updates.Info.forEach(info => {
      const terms = info.getTerms();
      // log questions asked by agent
      if (!info.isQuery() && terms.action === Info.ACTIONS.ASK.name) {
        KB.get._questionsAsked.add(terms.info.id);
      }
    });
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

// for person to discuss with checks
let askForConvoTime = Date.now() + 15000;
const askForConvoWait = DELAYS.getDelay("decide-to-ask-convo");
const ignoreAgents = [10, 11];

function personToDiscussWith(): Agent {
  const pplOfInterest = new Set(KB.get.agentsOfInterest());
  for (const agent of KB.get.player.conversationRequesters) {
    if (pplOfInterest.has(agent)) {
      return agent;
    } else if (DECIDES.decide("accept-convo")) {
      return agent;
    }
  }
  if (Date.now() - askForConvoTime > askForConvoWait) {
    for (const agent of KB.get.curRoom.getAgents(KB.get.player)) {
      if (ignoreAgents.indexOf(agent.id) !== -1) {
        // ignore guild leaders
        continue;
      }
      if (pplOfInterest.has(agent) && DECIDES.decide("decide-convo-poi")) {
        return agent;
      } else if (DECIDES.decide("decide-convo-random")) {
        return agent;
      }
    }
  }
  return undefined;
}

async function act() {
  if (!_canBegin || _updatingKB) {
    return;
  }
  const item = itemToPickUp();
  let person = undefined;
  // check to initiate new pickup of item
  if (!pickUpState && item) {
    pickUpState = new PickUpItemBehavior(item, function(
      this: PickUpItemBehavior
    ): BehaviorState {
      if (this._complete) {
        return SuccessBehavior.instance;
      } else {
        return this;
      }
    });
    // check to initiate a discussion with an agent (includes trade)
  } else if (
    !discussStrat &&
    !questStrat.cannotDiscuss() &&
    (person = personToDiscussWith())
  ) {
    discussStrat = new DiscussionStrategy(person);
    const pois = KB.get.agentsOfInterest().reduce((a, b) => {
      return a + b + " ";
    }, "");
    log("Looked at people of interest: " + pois, log.ACT);
    log("Entering into discussion strategy with " + person, log.ACT);
  }

  // tick highest priority state act/tick
  if (pickUpState) {
    // pick up an item
    pickUpState = await pickUpState.tick();
  } else if (discussStrat) {
    // handle discussion
    await discussStrat.act();
  } else {
    await questStrat.act();
  }

  // Clean up states
  if (pickUpState === SuccessBehavior.instance) {
    pickUpState = undefined;
  }
  if (discussStrat && discussStrat.complete) {
    log("Leaving discussion strategy", log.ACT);
    askForConvoTime = Date.now();
    discussStrat = undefined;
  }
}

// =======Start Bot========== //
/*       */ init(); /*        */
// ========================== //
