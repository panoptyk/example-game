import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, Quest, IDObject } from "panoptyk-engine/dist/";
import * as Helper from "../helper";

const username = process.argv[2];
const password = process.argv[3];
let acting = false;
let state = "patrol";
// patrol related variables
const zone = process.argv[4];
let zoneIDs: Set<number>;
const talked = new Set<Agent>();
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
            console.log(err);
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
    state = ClientAPI.playerAgent.activeAssignedQuests.length ? "quest" : "patrol";
    if (state === "patrol") {
        if (!zoneIDs.has(ClientAPI.playerAgent.room.id)) {
            await dumbNavigate(zoneIDs.values().next().value);
        }
        await patrolHandler();
    }
    else if (state === "quest") {
        await questHandler();
    }
}

/**
 * this should eventually be replaced by a real navigation algorithm
 */
async function dumbNavigate(roomID: number) {
    while (ClientAPI.playerAgent.room.id !== roomID) {
        const potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
        const dest = potentialRooms.find(room => room.id === roomID);
        if (dest) await ClientAPI.moveToRoom(dest);
        else await ClientAPI.moveToRoom(potentialRooms[Helper.randomInt(0, potentialRooms.length)]);
    }
}

async function patrolHandler() {
    if (ClientAPI.playerAgent.conversation) {
        const other: Agent = Helper.getOthersInConversation()[0];
        conUpdate = conUpdate ? conUpdate : Date.now();
        prevInfoLen = prevInfoLen ? prevInfoLen : ClientAPI.playerAgent.getInfoByAgent(other).length;

        if (!talked.has(other)) {
            for (const info of ClientAPI.playerAgent.knowledge) {
                // temporary fix to avoid spamming too much info
                if (info.action === "MOVE") {
                    continue;
                }
                // tell other agent everything we know that we have not already told them
                const hasTold = ClientAPI.playerAgent.getInfoByAction("TOLD").find(told => told.getTerms().info === info);
                if (!hasTold) {
                    // dont tell about something they were directly involved in
                    const involved = info.agents.find(id => id === other.id);
                    if (!involved) {
                        await ClientAPI.tellInfo(info);
                    }
                }
            }
        }
        talked.add(other);

        // give other agent time to interact and extend timer when they tell us something
        const infoLen = ClientAPI.playerAgent.getInfoByAgent(other).length;
        if (Date.now() - conUpdate <= 5000 || prevInfoLen < infoLen) {
            if (prevInfoLen < infoLen) {
                prevInfoLen = infoLen;
                conUpdate += 1000;
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
        if (ClientAPI.playerAgent.conversationRequesters.length > 0) {
            const validRequester = ClientAPI.playerAgent.conversationRequesters.find(agent => !talked.has(agent));
            if (validRequester) {
                await ClientAPI.acceptConversation(validRequester);
            }
        }
        else {
            // attempt to start conversation with agents we have not told everything
            const targetAgent: Agent = Helper.getOthersInRoom().find(agent => !talked.has(agent) && !agent.conversation);
            if (targetAgent) {
                await ClientAPI.requestConversation(targetAgent);
            }
            // continue patrol if there is no one left to interact with
            else {
                const potentialRooms = [];
                for (const room of ClientAPI.playerAgent.room.getAdjacentRooms()) {
                    if (zoneIDs.has(room.id)) {
                        potentialRooms.push(room);
                    }
                }
                await ClientAPI.moveToRoom(potentialRooms[Helper.randomInt(0, potentialRooms.length)]);
                talked.clear();
            }
        }
    }
}

async function questHandler() {

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