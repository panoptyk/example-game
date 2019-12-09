import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, Quest, IDObject } from "panoptyk-engine/dist/";
import * as Helper from "../helper";

const username = process.argv[2];
const password = process.argv[3];
let acting = false;
let roomUpdate: number;
// patrol related variables
const zone = process.argv[4];
let zoneIDs: Set<number>;
const talked = new Set<Agent>();
const requested = new Set<Agent>();
// conversation related variables
let conUpdate: number;
let prevInfoLen: number;


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
        await dumbNavigate(zoneIDs.values().next().value);
    }
    await patrolHandler();
}

/**
 * this should eventually be replaced by a real navigation algorithm
 */
async function dumbNavigate(roomID: number) {
    while (ClientAPI.playerAgent.room.id !== roomID) {
        const potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
        const dest = potentialRooms.find(room => room.id === roomID);
        if (dest) await ClientAPI.moveToRoom(dest);
        else {
            await ClientAPI.moveToRoom(potentialRooms[Helper.randomInt(0, potentialRooms.length)]);
            roomUpdate = Date.now();
        }
    }
}

async function patrolHandler() {
    if (ClientAPI.playerAgent.conversation) {
        requested.clear(); // we clear our memory of requested conversations here because requests are cancelled when convo starts
        const other: Agent = Helper.getOthersInConversation()[0];
        conUpdate = conUpdate ? conUpdate : Date.now(); // last time convo was updated with something
        prevInfoLen = prevInfoLen ? prevInfoLen : ClientAPI.playerAgent.getInfoByAgent(other).length; // last amount of info we had from/about other agent

        if (!talked.has(other) && other.faction === ClientAPI.playerAgent.faction) {
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
            await ClientAPI.leaveConversation(ClientAPI.playerAgent.conversation);
        }
    }
    else {
        conUpdate = 0;
        prevInfoLen = 0;
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
        // attempt to start conversation with agents we have not told everything
        let done = true;
        for (const other of Helper.getOthersInRoom()) {
            if (!requested.has(other) && !talked.has(other) && !other.inConversation()) {
                await ClientAPI.requestConversation(other);
                roomUpdate = Date.now();
                requested.add(other);
                return;
            }
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