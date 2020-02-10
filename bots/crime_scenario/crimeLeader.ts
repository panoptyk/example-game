import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, Quest, IDObject } from "panoptyk-engine/dist/";
import * as Helper from "../utils/helper";
import e = require("express");

const username = process.argv[2];
const password = process.argv[3];
let acting = false;
let state = "idle";
// track quest data
let lastIdx = 0;
const unassignedInfoQuest = new Set<Info>();
const assignedInfoQuest = new Set<Info>();
const unassignedItemQuest = new Set<Item>();
const assignedItemQuest = new Set<Item>();
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
    parseInfo();
    switch (state) {
        case "idle":
            await idleHandler();
            break;
        case "assign":
            await questAssignHandler();
            break;
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
            console.log(username + " leaving conversation with " + other + " due to inactivity");
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

function eligibleForQuest(agent: Agent): boolean {
    if (agent.faction === ClientAPI.playerAgent.faction && Helper.getQuestsGivenToAgent(agent).length === 0) {
        return true;
    }
    return false;
}

async function questAssignHandler() {
    if (ClientAPI.playerAgent.inConversation() && eligibleForQuest(Helper.getOthersInConversation()[0])) {
        const other: Agent = Helper.getOthersInConversation()[0];
        if (unassignedInfoQuest.size > 0) {
            const partial: Info = Array.from(unassignedInfoQuest)[0];
            unassignedInfoQuest.delete(partial);
            assignedInfoQuest.add(partial);
            // tell info relevant to quest
            const tellInfo: Info[] = ClientAPI.playerAgent.getInfoByAction("TOLD");
            for (const tell of tellInfo) {
                if (tell.getTerms().info.equals(partial)) {
                    await ClientAPI.tellInfo(tell);
                }
            }
            await ClientAPI.giveQuest(other, partial.getTerms(), true);
        }
        else if (unassignedItemQuest.size > 0) {
            const item: Item = Array.from(unassignedItemQuest)[0];
            unassignedItemQuest.delete(item);
            assignedItemQuest.add(item);
            const tellInfo: Info[] = ClientAPI.playerAgent.getInfoByItem(item);
            for (const tell of tellInfo) {
                await ClientAPI.tellInfo(tell);
            }
            const command = Info.ACTIONS.GAVE.question({agent1: other, agent2: ClientAPI.playerAgent, time: undefined, loc: undefined, item, quantity: 1});
            await ClientAPI.giveQuest(other, command, false);
        }
        console.log(ClientAPI.playerAgent + " ASSIGNED QUEST!");
        state = "idle";
    }
    // leader attemps to enter conversation with faction member that does not have an assigned quest
    else if (!ClientAPI.playerAgent.inConversation()) {
        for (const other of Helper.getOthersInRoom()) {
            if (eligibleForQuest(other)) {
                await ClientAPI.requestConversation(other);
                return;
            }
        }
    }
    // resorts to idle behavior if unable to converse with a quest agent
    await idleHandler();
}

/**
 * loads assigned quests
 */
function loadQuests() {
    for (const quest of ClientAPI.playerAgent.activeGivenQuests) {
        if (quest.type === "question") {
            assignedInfoQuest.add(quest.task);
        }
        else if (quest.type === "command") {
            assignedItemQuest.add(quest.task.getTerms().item);
        }
    }
}

/**
 * Mark partial info for quest assignment
 */
function parseInfo() {
    for (lastIdx; lastIdx < ClientAPI.playerAgent.knowledge.length; lastIdx++) {
        const info: Info = ClientAPI.playerAgent.knowledge[lastIdx];
        if (info.isMasked() && !assignedInfoQuest.has(info)) {
            unassignedInfoQuest.add(info);
        }
        else {
            const item: Item = info.getTerms().item;
            if (!ClientAPI.playerAgent.hasItem(item)
            && !assignedItemQuest.has(item)) {
                unassignedItemQuest.add(item);
            }
        }
    }
    if (unassignedItemQuest.size > 0 || unassignedInfoQuest.size > 0) {
        state = "assign";
    }
}

/**
 * Handles initial login process for agent
 */
function init() {
    ClientAPI.init();
    ClientAPI.login(username, password).then(res => {
        console.log("Login success! " + ClientAPI.playerAgent);
        loadQuests();
        main();
    }).catch(err => {
        throw new Error("Login fail!");
    });
}

init();