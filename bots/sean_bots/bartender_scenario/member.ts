import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, Quest, IDObject } from "panoptyk-engine/dist/";
import * as Helper from "../../utils/helper";

const username = process.argv[2];
const password = process.argv[3];
let acting = false;
let roomUpdate: number;
let state = "patrol";
// patrol related variables
const zone = process.argv[4];
let zoneIDs: Set<number>;
const talked = new Set<Agent>();
const requested = new Set<Agent>();
// conversation related variables
let conUpdate: number;
let prevInfoLen: number;
const answeredQuestions = new Set<Info>();

function prepForConversation() {
    conUpdate = 0;
    prevInfoLen = 0;
    answeredQuestions.clear();
}

function hasNewInfoToTell(other: Agent): boolean {
    for (const cinfo of ClientAPI.playerAgent.knowledge) {
        // temporary fix to avoid spamming too much info
        if (cinfo.action === "MOVE" || cinfo.action === "TOLD" || cinfo.action === "CONVERSE") {
            continue;
        }
        // tell other agent everything we know that we have not already told to them or been told by them
        const hasTold = ClientAPI.playerAgent.getInfoByAction("TOLD").find(told =>
            told.getTerms().info.equals(cinfo) && (told.getTerms().agent1 === other ||
            told.getTerms().agent2 === other));
        if (!hasTold) {
           return true;
        }
    }
    return false;
}

/**
 * Main triggers act at random time interval when possible
 */
function main() {
    if (!acting) {
        acting = true;
        act().catch(err => {
            // console.log(err);
        }).finally(() => {
            acting = false;
        });
    }
    // tslint:disable-next-line: ban
    setTimeout(main, Helper.randomInt(100, 200));
}

/**
 * Act picks an action to execute based on the bot's perception of the world
 */
async function act() {
    if (!zoneIDs.has(ClientAPI.playerAgent.room.id)) {
        await dumbNavigateStep(Array.from(zoneIDs)[0]);
    }
    else if (state === "patrol") {
        await patrolHandler();
    }
    else if (state === "converse") {
        await patrolConversationHandler();
    }
}

/**
 * this should eventually be replaced by a real navigation algorithm
 */
async function dumbNavigateStep(roomID: number) {
    if (ClientAPI.playerAgent.room.id !== roomID) {
        const potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
        const dest = potentialRooms.find(room => room.id === roomID);
        if (dest) await ClientAPI.moveToRoom(dest);
        else await ClientAPI.moveToRoom(potentialRooms[Helper.randomInt(0, potentialRooms.length)]);
    }
}

async function patrolConversationHandler() {
    if (ClientAPI.playerAgent.conversation) {
        const conv: Conversation = ClientAPI.playerAgent.conversation;
        requested.clear(); // we clear our memory of requested conversations here because requests are cancelled when convo starts
        const other: Agent = Helper.getOthersInConversation()[0];
        conUpdate = conUpdate ? conUpdate : Date.now(); // last time convo was updated with something
        prevInfoLen = prevInfoLen ? prevInfoLen : ClientAPI.playerAgent.getInfoByAgent(other).length; // last amount of info we had from/about other agent
        if (other.faction === ClientAPI.playerAgent.faction) {
            // answer any questions that allied agent asks
            for (const question of conv.askedQuestions) {
                if (!answeredQuestions.has(question)) {
                    console.log(username + " received question: " + question);
                    const relatedInfo: Info[] = Helper.getAllRelatedInfo(question);
                    for (const rInfo of relatedInfo) {
                        console.log(username + " telling answer: " + rInfo);
                        await ClientAPI.tellInfo(rInfo);
                    }
                    answeredQuestions.add(question);
                }
            }
            // tell allied agent any new info
            if (!talked.has(other)) {
                for (const cinfo of ClientAPI.playerAgent.knowledge) {
                    // temporary fix to avoid spamming too much info
                    if (cinfo.action === "MOVE" || cinfo.action === "TOLD" || cinfo.action === "CONVERSE") {
                        continue;
                    }
                    // tell other agent everything we know that we have not already told to them or been told by them
                    const hasTold = ClientAPI.playerAgent.getInfoByAction("TOLD").find(told =>
                        told.getTerms().info.equals(cinfo) && (told.getTerms().agent1 === other ||
                        told.getTerms().agent2 === other));
                    if (!hasTold) {
                        await ClientAPI.tellInfo(cinfo);
                    }
                }
            }
        }
        talked.add(other);
        // give other agent time to interact and extend timer when they tell us something
        const infoLen = ClientAPI.playerAgent.getInfoByAgent(other).length;
        if (Date.now() - conUpdate <= Helper.WAIT_FOR_OTHER || prevInfoLen < infoLen) {
            if (prevInfoLen < infoLen) {
                prevInfoLen = infoLen;
                conUpdate = Date.now();
            }
        }
        else {
            // console.log(username + " leaving conversation with " + other + " due to inactivity");
            await ClientAPI.leaveConversation(ClientAPI.playerAgent.conversation);
        }
    }
    else {
        state = "patrol";
        await patrolHandler();
    }
}

async function patrolHandler() {
    if (ClientAPI.playerAgent.conversation) {
        prepForConversation();
        state = "converse";
        await patrolConversationHandler();
    }
    else {
        // accept conversations from approaching agents if we havent already talked to them in this room
        for (const requester of ClientAPI.playerAgent.conversationRequesters) {
            if (!talked.has(requester)) {
                await ClientAPI.acceptConversation(requester);
                roomUpdate = Date.now();
                return;
            }
            else {
                await ClientAPI.rejectConversation(requester);
            }
        }
        // attempt to start conversations with suitable agents
        let done = true;
        for (const other of Helper.getOthersInRoom()) {
            if (other.faction === ClientAPI.playerAgent.faction &&
            !requested.has(other) && !talked.has(other) && !other.inConversation()) {
                // only request conversation if we have new info to tell agent
                const needToTell: boolean = hasNewInfoToTell(other);
                if (needToTell) {
                    await ClientAPI.requestConversation(other);
                }
                roomUpdate = Date.now();
                requested.add(other);
                return;
            }
            // delay leaving room as long as we have active conversation requests that have not been rejected
            else if (!talked.has(other) && ClientAPI.playerAgent.activeConversationRequestTo(other)) done = false;
        }
        // continue patrol if there is no one left to interact with
        if (done || Date.now() - roomUpdate > Helper.WAIT_FOR_OTHER) {
            const potentialRooms = [];
            for (const room of ClientAPI.playerAgent.room.getAdjacentRooms()) {
                if (zoneIDs.has(room.id)) {
                    potentialRooms.push(room);
                }
            }
            await ClientAPI.moveToRoom(potentialRooms[Helper.randomInt(0, potentialRooms.length)]);
            roomUpdate = Date.now();
            talked.clear();
            requested.clear();
        }
    }
}

/**
 * Handles initial login process for agent
 */
function init() {
    switch (zone) {
        case "bot":
            zoneIDs = new Set([1, 2, 3, 4]);
            break;
        case "mid":
            zoneIDs = new Set([4, 5, 6, 7]);
            break;
        case "top":
            zoneIDs = new Set([7, 8, 9]);
            break;
    }
    ClientAPI.init();
    ClientAPI.login(username, password).then(res => {
        console.log("Login success! " + ClientAPI.playerAgent);
        main();
    }).catch(err => {
        throw new Error("Login fail!");
    });
}

init();