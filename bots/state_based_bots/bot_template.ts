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
import { BehaviourState } from "./behavior_state";
import { IdleBehavior } from "./IdleBehavior/idle_behavior";
import { IdleState } from "./ActionStates/idle_state";

  // Boilerplate agent code ================================================== START
  const username = process.argv[2] ? process.argv[2] : "idle";
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

  let currentBehaviour: BehaviourState = new IdleBehavior (new IdleState ());

  async function act () {
    await currentBehaviour.act ();
    currentBehaviour = currentBehaviour.nextBehavior ();
  }

init ();