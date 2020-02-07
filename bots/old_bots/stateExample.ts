import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, Quest, IDObject } from "panoptyk-engine/dist/";
import { AttemptConversationWithAgent, State } from "./utils/state";
import * as Helper from "./utils/helper";

const username = process.argv.length >= 3 ? process.argv[2] : "James Bond";
const password = process.argv.length > 3 ? process.argv[3] : "password";
let acting = false;
let state: State;

/**
 * Behavioral State that determines what action states to attempt
 */
class WanderingTalker implements State {
    alreadyAsked = new Set<Agent>();
    async act(): Promise<State> {
        if (ClientAPI.playerAgent.conversation) {
            console.log("yay got conversation!");
        }
        else {
            for (const occupant of Helper.getOthersInRoom()) {
                if (!this.alreadyAsked.has(occupant)) {
                    this.alreadyAsked.add(occupant);
                    return new AttemptConversationWithAgent(occupant, this, false, this, 10000);
                }
            }
            // randomly wander if we found no one ot talk to
            await Helper.dumbNavigateStep("random");
            this.alreadyAsked.clear();
        }
        return this;
    }
}

/**
 * Main triggers act every 100ms when possible
 */
function main() {
    if (!acting) {
        acting = true;
        act().catch(err => {
            console.log(err);
        }).finally(() => {
            acting = false;
        });
    }
    // tslint:disable-next-line: ban
    setTimeout(main, 100);
}

/**
 * Act picks an action to execute based on the bot's perception of the world
 */
async function act() {
    if (state) {
        state = await state.act();
    }
    else {
        process.exit(0);
    }
}

/**
 * Handles initial login process for agent
 */
function init() {
    ClientAPI.init();
    ClientAPI.login(username, password).then(res => {
        console.log("Login success! " + ClientAPI.playerAgent);
        state = new WanderingTalker();
        main();
    }).catch(err => {
        throw new Error("Login fail!");
    });
}

init();