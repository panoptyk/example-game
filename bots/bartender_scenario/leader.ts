import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, Quest, IDObject } from "panoptyk-engine/dist/";
import * as Helper from "../helper";

const username = process.argv.length >= 3 ? process.argv[2] : "Elizabeth Alexandra Mary Windsor";
const password = process.argv.length > 3 ? process.argv[3] : "password";
let acting = false;
// track info for quests
const forQuest = new Set<Info>();
const assigned = new Set<Info>();
// conversation related variables
let conUpdate: number;
let prevInfoLen: number;

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
    if (!ClientAPI.playerAgent.inConversation() && forQuest.size === 0) {
        parseInfo();
    }
    if (forQuest.size > 0) {
        await questAssignHandler();
    }
    else {
        await idleHandler();
    }
}

async function idleHandler() {
    if (ClientAPI.playerAgent.conversation) {
        const other: Agent = Helper.getOthersInConversation()[0];
        conUpdate = conUpdate ? conUpdate : Date.now();
        prevInfoLen = prevInfoLen ? prevInfoLen : ClientAPI.playerAgent.getInfoByAgent(other).length;

        // give other agent time to interact and extend timer when they tell us something
        const infoLen = ClientAPI.playerAgent.getInfoByAgent(other).length;
        if (Date.now() - conUpdate <= Helper.WAIT_FOR_OTHER || prevInfoLen < infoLen) {
            if (prevInfoLen < infoLen) {
                prevInfoLen = infoLen;
                conUpdate = Date.now();
            }
        }
        else {
            await ClientAPI.leaveConversation(ClientAPI.playerAgent.conversation);
        }
    }
    else {
        conUpdate = 0;
        prevInfoLen = 0;
        // accept conversations from approaching agents if they are in same faction
        for (const requester of ClientAPI.playerAgent.conversationRequesters) {
            if (requester.faction === ClientAPI.playerAgent.faction) {
                await ClientAPI.acceptConversation(requester);
                return;
            }
            else {
                await ClientAPI.rejectConversation(requester);
            }
        }
    }
}

async function questAssignHandler() {
    if (ClientAPI.playerAgent.inConversation()) {
        const other: Agent = Helper.getOthersInConversation()[0];
        const partial: Info = Array.from(forQuest)[0];
        await ClientAPI.giveQuest(other, partial.getTerms(), true);
        forQuest.delete(partial);
        assigned.add(partial);
        console.log("QUEST ASSIGNED!");
        // tell info relevant to quest
        const tellInfo: Info[] = ClientAPI.playerAgent.getInfoByAction("TOLD");
        for (const tell of tellInfo) {
            if (tell.getTerms().info.equals(partial)) {
                await ClientAPI.tellInfo(tell);
                console.log("QUEST ASSIGNER TOLD: " + tell.infoID);
            }
        }
    }
    // leader is lazy and only attemps to assign quest if appropiate member is in same room
    else if (ClientAPI.playerAgent.conversationRequested.length === 0) {
        for (const other of Helper.getOthersInRoom()) {
            if (other.agentName === "James Bond") {
                await ClientAPI.requestConversation(other);
                return;
            }
        }
        await idleHandler();
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
    // don't re-add assigned quests
    for (const quest of ClientAPI.playerAgent.activeGivenQuests) {
        if (forQuest.has(quest.task)) {
            forQuest.delete(quest.task);
            assigned.add(quest.task);
        }
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