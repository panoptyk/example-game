import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, getPanoptykDatetime } from "panoptyk-engine/dist/";

const username = process.argv.length >= 3 ? process.argv[2] : "Joseph Stalin";
const password = process.argv.length > 3 ? process.argv[3] : "password";

let lastMove: number;

async function leaveRoom() {
    const adjacents = ClientAPI.playerAgent.room.getAdjacentRooms();
    const next = Math.floor(Math.random() * Math.floor(adjacents.length));
    await ClientAPI.moveToRoom(adjacents[next]).then(res => {
        lastMove = Date.now();
    }).catch(err => {
        console.log(err.message);
    });
}

/**
 * Sends conversation requests to all other agents in room
 */
async function sendRequests() {
    for (const other of ClientAPI.playerAgent.room.occupants) {
        if (other.id !== ClientAPI.playerAgent.id) {
            await ClientAPI.requestConversation(other).catch(err => {
                console.log(err.message);
            });
        }
    }
}

async function informationTrade() {
    while (ClientAPI.playerAgent.inConversation()) {
        const trades: Trade[] = Trade.getActiveTradesWithAgent(ClientAPI.playerAgent);
        if (trades.length > 0) {
            for (const question of ClientAPI.playerAgent.conversation.askedQuestions) {
                // try to find an answer for question with current knowledge
                const potentialAns = ClientAPI.playerAgent.getInfoByAction(question.action);
                if (potentialAns) {
                    // confirm that answer is valid
                }
            }
            await ClientAPI.setTradeReadyStatus(true).catch(err => {
                console.log(err.message);
            });
        }
        else {
            // attempt to start trade with anyone in conversation
            for (const agent of ClientAPI.playerAgent.conversation.getAgents(ClientAPI.playerAgent)) {
                await ClientAPI.requestTrade(agent).catch(err => {
                    console.log(err.message);
                });
            }
        }
        // delay next iteration of loop to avoid spinning cpu
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 1000));
    }
}

/**
 * Handles question conversation logic for answering agent
 */
async function conversationAnswerTest() {
    while (ClientAPI.playerAgent.inConversation()) {
        for (const question of ClientAPI.playerAgent.conversation.askedQuestions) {
            // try to find an answer for question with current knowledge
            const potentialAns = ClientAPI.playerAgent.getInfoByAction(question.action);
            if (potentialAns) {
                // start trade when answer is found
                await informationTrade();
                return;
            }
            await ClientAPI.passOnQuestion(question).catch(err => {
                console.log(err.message);
            });
        }
        // delay next iteration of loop to avoid spinning cpu
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 1000));
    }
}

/**
 * Handles question conversation logic for asking agent
 */
async function conversationAskTest() {
    const other = ClientAPI.playerAgent.conversation.getAgents(ClientAPI.playerAgent)[0];
    const pred = Info.ACTIONS.MOVE.question({agent: other, time: undefined, loc1: undefined, loc2: ClientAPI.playerAgent.room});
    await ClientAPI.askQuestion(pred).catch(err => {
        console.log(err.message);
    });
    await informationTrade();
}

async function tradeHandler(other: Agent) {
    while (ClientAPI.playerAgent.trade) {
        const trade = ClientAPI.playerAgent.trade;
        if (trade.getAgentItemsData(other).length > 0 && trade.getAgentItemsData(ClientAPI.playerAgent).length === 0) {
            await ClientAPI.offerItemsTrade(ClientAPI.playerAgent.inventory);
        }
        if (trade.getAgentInfosData(other).length > 0 && trade.getAgentInfosData(ClientAPI.playerAgent).length === 0) {
            
        }
        await ClientAPI.setTradeReadyStatus(true);
        // delay next iteration of loop to avoid spinning cpu
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 500));
    }
}

async function conversationHandler() {
    while (ClientAPI.playerAgent.inConversation()) {
        const requests = ClientAPI.playerAgent.tradeRequesters;
        if (requests.length > 0) {
            await ClientAPI.acceptTrade(requests[0]);
            await tradeHandler(requests[0]);
        }

        // delay next iteration of loop to avoid spinning cpu
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 500));
    }
}

async function main() {
    while (true) {
        await ClientAPI.takeItems(ClientAPI.playerAgent.room.getItems());
        await ClientAPI.dropItems(ClientAPI.playerAgent.inventory);
        return;
        if (ClientAPI.playerAgent.conversationRequesters.length > 0) {
            await ClientAPI.acceptConversation(ClientAPI.playerAgent.conversationRequesters[0]);
            await conversationHandler();
        }

        // delay next iteration of loop to avoid spinning cpu
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 500));
    }
}

/**
 * Handles initial login process for agent
 */
async function init() {
    ClientAPI.init();
    await ClientAPI.login(username, password).then(res => {
        console.log("Login success! " + ClientAPI.playerAgent);
    }).catch(err => {
        throw new Error("Login fail!");
    });
    lastMove = Date.now();
    main();
}

init();