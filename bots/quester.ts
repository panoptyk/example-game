import { Agent, Room, Info, Trade, Item, Conversation, ClientAPI, randomInt, Quest } from "panoptyk-engine/dist/";

const username = process.argv.length >= 3 ? process.argv[2] : "James Bond";
const password = process.argv.length > 3 ? process.argv[3] : "password";

/**
 * Navigates to room using UCS
 * @param room target room
 */
async function navigateToRoom(room: Room) {

}

async function obtainQuest() {
    while (true) {
        for (const other of ClientAPI.playerAgent.room.getAgents(ClientAPI.playerAgent)) {
            if (other.agentName === "Elizabeth Alexandra Mary Windsor") {
                while (!ClientAPI.playerAgent.inConversation()) {
                    await ClientAPI.requestConversation(other).catch(err => {
                        console.log(err.message);
                    });
                }
                while (ClientAPI.playerAgent.inConversation()) {
                    if (ClientAPI.playerAgent.activeAssignedQuests.length > 0) {
                        return;
                    }
                    // delay next iteration of loop to avoid spinning cpu
                    // tslint:disable-next-line: ban
                    await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 500));
                }
            }
        }
        const adjacents = ClientAPI.playerAgent.room.getAdjacentRooms();
        await ClientAPI.moveToRoom(adjacents[randomInt(0, adjacents.length)]);
    }
}

// REVIEW
/**
 * Turns in item to faction leader
 * @param targetItem
 */
async function turnInItem(targetItem: Item) {
    while (true) {
        for (const other of ClientAPI.playerAgent.room.getAgents(ClientAPI.playerAgent)) {
            if (other.agentName === "Elizabeth Alexandra Mary Windsor") {
                while (!ClientAPI.playerAgent.inConversation()) {
                    await ClientAPI.requestConversation(other).catch(err => {
                        console.log(err.message);
                    });
                }
                while (!ClientAPI.playerAgent.trade) {
                    await ClientAPI.requestTrade(other);
                    // delay next iteration of loop to avoid spinning cpu
                    // tslint:disable-next-line: ban
                    await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 500));
                }
                await ClientAPI.offerItemsTrade([targetItem]);
                while (ClientAPI.playerAgent.trade) {
                    await ClientAPI.setTradeReadyStatus(true).catch(err => {
                        console.log(err.message);
                    });
                    // delay next iteration of loop to avoid spinning cpu
                    // tslint:disable-next-line: ban
                    await new Promise(javascriptIsFun => setTimeout(javascriptIsFun, 500));
                }
                return;
            }
        }
        const adjacents = ClientAPI.playerAgent.room.getAdjacentRooms();
        await ClientAPI.moveToRoom(adjacents[randomInt(0, adjacents.length)]);
    }
}

async function turnInQuest(quest: Quest, result: Info) {
    while (true) {
        for (const other of ClientAPI.playerAgent.room.getAgents(ClientAPI.playerAgent)) {
            if (other.agentName === "Elizabeth Alexandra Mary Windsor") {
                while (!ClientAPI.playerAgent.inConversation()) {
                    await ClientAPI.requestConversation(other).catch(err => {
                        console.log(err.message);
                    });
                }
                ClientAPI.completeQuest(quest, result);
                return;
            }
        }
        const adjacents = ClientAPI.playerAgent.room.getAdjacentRooms();
        await ClientAPI.moveToRoom(adjacents[randomInt(0, adjacents.length)]);
    }
}

async function obtainItem(target: Item) {
    while (!ClientAPI.playerAgent.hasItem(target)) {
        if (ClientAPI.playerAgent.room.hasItem(target)) {
            await ClientAPI.takeItems([target]);
            return;
        }
        const itemInfo = ClientAPI.playerAgent.getInfoByItem(target);
        const agents: Agent[] = [];
        let lastInfo = itemInfo[0];
        for (const info of itemInfo) {
            if (info.time > lastInfo.time) {
                lastInfo = info;
            }
            agents.push(lastInfo.getTerms().agent);
        }
        if (ClientAPI.playerAgent.room !== lastInfo.getTerms().room) {
            const adjacents = ClientAPI.playerAgent.room.getAdjacentRooms();
            await ClientAPI.moveToRoom(adjacents[randomInt(0, adjacents.length)]);
        }
        else {
            // attempt to get target item off of any agents in the room
            while (agents) {
                const other = agents.pop();
                // redoing this section
            }
        }
    }
}

async function main() {
    if (ClientAPI.playerAgent.activeAssignedQuests.length === 0) {
        await obtainQuest();
    }
    const quest = ClientAPI.playerAgent.activeAssignedQuests[0];
    // REVIEW
    if (quest.type === "command") {
        // handle quest differently based on assigned action
        if (quest.task.action === "GAVE") {
            const target = quest.task.getTerms().item;
            await obtainItem(target);
            await turnInItem(target);
            // REVIEW
            // find the information we just generated to complete quest
            let result: Info;
            for (const info of ClientAPI.playerAgent.getInfoByItem(target)) {
                if (quest.checkSatisfiability(info)) {
                    result = info;
                    break;
                }
            }
            await turnInQuest(quest, result);
        }
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