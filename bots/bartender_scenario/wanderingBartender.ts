import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, IDObject } from "panoptyk-engine/dist/";
import * as Helper from "../helper";

const username = process.argv.length >= 3 ? process.argv[2] : "Bartender";
const password = process.argv.length > 3 ? process.argv[3] : "password";
let acting = false;
let state = "idle";
let convoStart = 0;
let convoQuestion: Info;
// special info for quest
let specialInfo: Info;
// let desiredItem: Item;
const toldAgents = new Set<Agent>();
const alreadyRequested = new Set<Agent>();
let requestRefresh = Date.now();

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
    setTimeout(main, Helper.randomInt(100, 200));
}

/**
 * Act picks an action to execute based on the bot's perception of the world
 */
async function act() {
    if (specialInfo === undefined) {
        // navigate to special room
        if (ClientAPI.playerAgent.room.id !== 10) {
            await dumbNavigateStep(10);
        }
        // generate information to sell to other factions
        else if (!otherFactionPresent()) {
            await ClientAPI.dropGold(1);
            // make sure someone did not walk into room as we were dropping
            if (!otherFactionPresent()) {
                 // pick the most recent of drop events generated
                for (const dropInfo of ClientAPI.playerAgent.getInfoByAction("DROP")) {
                    const terms = dropInfo.getTerms();
                    if (terms.agent === ClientAPI.playerAgent &&
                        (specialInfo === undefined || dropInfo.time >= specialInfo.time)) {
                        specialInfo = dropInfo;
                    }
                }
            }
        }
    }
    else if (state === "idle") {
        // wander aimlessly
        await randomNavigate();
    }
    else if (state === "bartender") {
        // move out of special room if in it
        if (ClientAPI.playerAgent.room.id === 10) {
            await randomNavigate();
        }
        // attempt to sell generated info
        else if (ClientAPI.playerAgent.conversation) {
            if (convoStart !== 0 && Date.now() - convoStart > 60000) {
                await ClientAPI.leaveConversation(ClientAPI.playerAgent.conversation);
            }
            else if (ClientAPI.playerAgent.trade) {
                await tradeHandler();
            }
            else {
                await conversationHandler();
            }
        }
        else {
            convoStart = 0;
            if (ClientAPI.playerAgent.conversationRequesters.length > 0) {
                const requesters = ClientAPI.playerAgent.conversationRequesters;
                await ClientAPI.acceptConversation(requesters[Helper.randomInt(0, requesters.length)]);
            }
            else {
                // periodically forget that agents have refused a conversation
                if (Date.now() - requestRefresh > 10 * Helper.WAIT_FOR_OTHER) {
                    alreadyRequested.clear();
                    requestRefresh = Date.now();
                }
                for (const other of Helper.getOthersInRoom()) {
                    if (other.faction !== ClientAPI.playerAgent.faction && !other.inConversation() &&
                    !toldAgents.has(other) && !alreadyRequested.has(other)) {
                        await ClientAPI.requestConversation(other);
                        alreadyRequested.add(other);
                        return;
                    }
                }
            }
        }
    }
}

function otherFactionPresent(): boolean {
    for (const agent of Helper.getOthersInRoom()) {
        if (agent.faction !== ClientAPI.playerAgent.faction) {
            return true;
        }
    }
    return false;
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

async function randomNavigate() {
    const potentialRooms = ClientAPI.playerAgent.room.getAdjacentRooms();
    await ClientAPI.moveToRoom(potentialRooms[Helper.randomInt(0, potentialRooms.length)]);
}

async function conversationHandler() {
    if (convoStart === 0) convoStart = Date.now();
    const conversation: Conversation = ClientAPI.playerAgent.conversation;
    const other: Agent = Helper.getOthersInConversation()[0];
    if (!toldAgents.has(other)) {
        // tell same masked info to everyone
        console.log(ClientAPI.playerAgent + " TOLD SPECIAL INFO " + specialInfo.infoID + " to " + other);
        await ClientAPI.tellInfo(specialInfo, ["agent", "loc"]);
        toldAgents.add(other);
    }
    // request trade if other wants to know all of specialInfo
    if (!ClientAPI.playerAgent.activeTradeRequestTo(other)) {
        // request trade if other wants to know all of specialInfo
        const specificQuestion: Info = conversation.askedQuestions.find(
            info => specialInfo.isAnswer(info));
        if (specificQuestion) {
            await ClientAPI.requestTrade(other);
            convoQuestion = specificQuestion;
        }
    }
}

async function tradeHandler() {
    const trade: Trade = ClientAPI.playerAgent.trade;
    const other: Agent = Helper.getOtherInTrade();

    // offer specialInfo if other agent has asked for it
    if (Helper.getMyOfferedInfo(trade).length < 1) {
        await ClientAPI.offerAnswerTrade(specialInfo, convoQuestion);
    }
    // attempt to accquire desiredItem
    if (!trade.getAgentReadyStatus(ClientAPI.playerAgent)) {
        // TODO: ability to request gold
        // const desiredInTrade: Item = trade.getAgentItemsData(other).find(item => item === desiredItem);
        // if (desiredInTrade) {
        //     await ClientAPI.setTradeReadyStatus(true);
        //     console.log(ClientAPI.playerAgent + " ACCEPTED TRADE");
        //     return;
        // }
        // if (trade.getAgentsRequestedItems(ClientAPI.playerAgent).size < 1) {
        //     await ClientAPI.requestItemTrade(desiredItem);
        // }
        if (trade.getAgentsOfferedGold(other) >= 1) {
            await ClientAPI.setTradeReadyStatus(true);
            console.log(ClientAPI.playerAgent + " ACCEPTED TRADE");
            return;
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

process.on("message", (m) => {
    console.log("command received");
    if (m === "begin quest") {
        state = "bartender";
        console.log("New bartender: " + username);
    }
    else if (m === "stand down") {
        specialInfo = undefined;
        toldAgents.clear();
        state = "idle";
    }
});
init();