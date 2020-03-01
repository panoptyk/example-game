import {
  Agent,
  Room,
  Info,
  Trade,
  Item,
  Conversation,
  ClientAPI,
  getPanoptykDatetime,
  logger,
  ActionGiveQuest
} from "panoptyk-engine/dist/client";

// Boilerplate agent code ================================================== START
const username = process.argv[2] ? process.argv[2] : "Chief";
const password = process.argv[3] ? process.argv[3] : "password";
const address = process.argv[4] ? process.argv[4] : "http://70.95.176.182:1791";

const MAX_RETRY = 10;
const RETRY_INTERVAL = 100; // ms before attempLogin() is called again to retry logging in
const ACT_INTERVAL = 2000; // ms before act() is called again(possibly)

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

const gaveQuest = new Set<Agent>();

const GiveQuest = function() {
  const otherAgent = ClientAPI.playerAgent.conversation.getAgents(ClientAPI.playerAgent)[0];
  const dummyInfo = {
    agents: [],
    items: [],
    locations: [],
    quantities: [],
    factions: []
  };
  const predicate = Info.ACTIONS.PICKUP.getTerms(dummyInfo as Info);
  let item;
  if (otherAgent.id === 3) {
    item = {id: 6};
  } else if (otherAgent.id === 4) {
    item = {id: 7};
  }
  if (!gaveQuest.has(otherAgent) && item) {
    predicate.agent = {id: otherAgent.id} as Agent;
    predicate.item = item as Item;
    ClientAPI.giveQuest(otherAgent, predicate, false).then(res => {
      gaveQuest.add(otherAgent);
    });
  }
};

async function act() {
  if (ClientAPI.playerAgent.conversation) {
    GiveQuest();
  } else if (ClientAPI.playerAgent.conversationRequesters.length > 0) {
    ClientAPI.acceptConversation(ClientAPI.playerAgent.conversationRequesters[0]);
  }
}

// =======Start Bot========== //
/*       */ init(); /*        */
// ========================== //
