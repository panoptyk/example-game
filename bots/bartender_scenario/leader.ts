import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, Quest, IDObject } from "panoptyk-engine/dist/";
import * as Helper from "../helper";

const username = process.argv.length >= 3 ? process.argv[2] : "Elizabeth Alexandra Mary Windsor";
const password = process.argv.length > 3 ? process.argv[3] : "password";
let acting = false;
// track info for quests
const forQuest = new Set<Info>();
const assigned = new Set<Info>();

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
    if (ClientAPI.playerAgent.conversation) {
        await conversationHandler();
    }
    else if (ClientAPI.playerAgent.conversationRequesters.length > 0) {
        const requesters = ClientAPI.playerAgent.conversationRequesters;
        await ClientAPI.acceptConversation(requesters[Helper.randomInt(0, requesters.length)]);
    }
}

/**
 * Mark partial info for quest assignment
 */
function parseInfo() {
    for (const info of ClientAPI.playerAgent.knowledge) {
        if (info.isMasked() && !assigned.has(info)) {
            forQuest.add(info);
        }
    }
}

async function conversationHandler() {
    const other: Agent = Helper.getOthersInConversation()[0];
    parseInfo();
    if (forQuest.size > 0) {
        const info = Array.from(forQuest)[0];
        await ClientAPI.giveQuest(other, info.getTerms(), true);
        forQuest.delete(info);
        assigned.add(info);
        console.log("QUEST ASSIGNED!");
    }
}

/**
 * Handles initial login process for agent
 */
function init() {
    ClientAPI.init();
    ClientAPI.login(username, password).then(res => {
        console.log("Login success! " + ClientAPI.playerAgent);
        main();
    }).catch(err => {
        throw new Error("Login fail!");
    });
}

init();