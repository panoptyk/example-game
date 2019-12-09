import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, IDObject } from "panoptyk-engine/dist/";
import * as Helper from "../helper";

const username = process.argv.length >= 3 ? process.argv[2] : "Bartender";
const password = process.argv.length > 3 ? process.argv[3] : "password";
let acting = false;
let convoStart = 0;
let convoQuestion: Info;
// special info for quest
let specialInfo: Info;
let desiredItem: Item;
const toldAgents = new Set<Agent>();

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
        if (Date.now() - convoStart > 60000) {
            await ClientAPI.leaveConversation(ClientAPI.playerAgent.conversation);
        }
        else if (ClientAPI.playerAgent.trade) {
            await tradeHandler();
        }
        else {
            await conversationHandler();
        }
    }
    else if (ClientAPI.playerAgent.conversationRequesters.length > 0) {
        const requesters = ClientAPI.playerAgent.conversationRequesters;
        await ClientAPI.acceptConversation(requesters[Helper.randomInt(0, requesters.length)]);
        convoStart = Date.now();
    }
}

async function conversationHandler() {
    const conversation: Conversation = ClientAPI.playerAgent.conversation;
    const other: Agent = Helper.getOthersInConversation()[0];
    if (!toldAgents.has(other)) {
        // tell same masked info to everyone
        console.log("BARTENDER TOLD SPECIAL INFO");
        await ClientAPI.tellInfo(specialInfo, ["agent", "time"]);
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
    if (trade.getAgentInfosData(ClientAPI.playerAgent).length < 1) {
        await ClientAPI.offerAnswerTrade(specialInfo, convoQuestion);
    }
    // attempt to accquire desiredItem
    if (!trade.getAgentReadyStatus(ClientAPI.playerAgent)) {
        const desiredInTrade: Item = trade.getAgentItemsData(other).find(item => item === desiredItem);
        if (desiredInTrade) {
            await ClientAPI.setTradeReadyStatus(true);
            console.log("BARTENDER ACCEPTED TRADE");
            return;
        }
        if (trade.getAgentsRequestedItems(ClientAPI.playerAgent).size < 1) {
            await ClientAPI.requestItemTrade(desiredItem);
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
        specialInfo = ClientAPI.playerAgent.knowledge[0];
        desiredItem = ClientAPI.playerAgent.knowledge[1].getTerms().item;
        main();
    }).catch(err => {
        throw new Error("Login fail!");
    });
}

init();