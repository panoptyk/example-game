import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, randomInt, IDObject } from "panoptyk-engine/dist/";

const username = process.argv.length >= 3 ? process.argv[2] : "Elizabeth Alexandra Mary Windsor";
const password = process.argv.length > 3 ? process.argv[3] : "password";

async function assignRetrievalQuest(agent: Agent, target: Item, relevantInfo: Info[]) {
    for (const info of relevantInfo) {
        await ClientAPI.tellInfo(info).catch(err => {
            console.log(err.message);
        });
    }
    // REVIEW
    // creation of quest
    const pred = Info.ACTIONS.GAVE.question({time: undefined, agent1: agent,
        agent2: ClientAPI.playerAgent, item: target, loc: undefined, quantity: 1});
    await ClientAPI.giveQuest(agent, pred, false).catch(err => {
        console.log(err.message);
    });
}

async function tradeHandler(other: Agent) {
    await ClientAPI.acceptTrade(other).catch(err => {
        console.log(err.message);
    });
    while (ClientAPI.playerAgent.trade) {
        if (!ClientAPI.playerAgent.trade.getAgentReadyStatus(ClientAPI.playerAgent)) {
            await ClientAPI.setTradeReadyStatus(true).catch(err => {
                console.log(err.message);
            });
        }
        // delay next iteration of loop to avoid spinning cpu
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 500));
    }
}

async function conversationHandler() {
    const other = ClientAPI.playerAgent.conversation.getAgents(ClientAPI.playerAgent)[0];
    let questAssigned = false;
    for (const quest of ClientAPI.playerAgent.activeGivenQuests) {
        if (quest.receiver === other) {
            questAssigned = true;
            break;
        }
    }
    if (!questAssigned) {
        const drop = ClientAPI.playerAgent.getInfoByAction("DROP")[0];
        await assignRetrievalQuest(other, drop.getTerms().item, [drop]);
    }
    while (ClientAPI.playerAgent.inConversation()) {
        const requests = ClientAPI.playerAgent.tradeRequesters;
        if (requests.length > 0) {
            await tradeHandler(requests[0]);
        }
        // delay next iteration of loop to avoid spinning cpu
        // tslint:disable-next-line: ban
        await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 500));
    }
}

async function main() {
    while (true) {
        const requesters = ClientAPI.playerAgent.conversationRequesters;
        if (requesters.length > 0) {
            await ClientAPI.acceptConversation(requesters[randomInt(0, requesters.length)]).catch(err => {
                console.log(err.message);
            });
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
    main();
}

init();